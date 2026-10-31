from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken


@dataclass
class ConnectionRecord:
    organization_id: str
    status: str  # disconnected | connecting | connected
    encrypted_refresh_token: str | None = None


class TokenStore:
    """Org-scoped connection + Fernet-encrypted refresh tokens on disk.

    Production should move ciphertext to a dedicated Neon table; the Fernet
    envelope and per-org keying stay the same.
    """

    def __init__(self, *, data_dir: str | Path, token_key: bytes) -> None:
        self._root = Path(data_dir)
        self._root.mkdir(parents=True, exist_ok=True)
        self._fernet = Fernet(token_key)

    def _path(self, organization_id: str) -> Path:
        safe = organization_id.replace("/", "_")
        return self._root / f"connection-{safe}.json"

    def get(self, organization_id: str) -> ConnectionRecord:
        path = self._path(organization_id)
        if not path.exists():
            return ConnectionRecord(
                organization_id=organization_id, status="disconnected"
            )
        raw = json.loads(path.read_text())
        return ConnectionRecord(
            organization_id=organization_id,
            status=str(raw.get("status") or "disconnected"),
            encrypted_refresh_token=raw.get("encrypted_refresh_token"),
        )

    def save(self, record: ConnectionRecord) -> None:
        path = self._path(record.organization_id)
        path.write_text(
            json.dumps(
                {
                    "organization_id": record.organization_id,
                    "status": record.status,
                    "encrypted_refresh_token": record.encrypted_refresh_token,
                },
                indent=2,
            )
        )

    def encrypt_token(self, plaintext: str) -> str:
        return self._fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")

    def decrypt_token(self, ciphertext: str) -> str:
        try:
            return self._fernet.decrypt(ciphertext.encode("utf-8")).decode(
                "utf-8"
            )
        except InvalidToken as error:
            raise ValueError("invalid encrypted token") from error

    def plaintext_absent_from_disk(self, organization_id: str) -> bool:
        path = self._path(organization_id)
        if not path.exists():
            return True
        text = path.read_text()
        record = self.get(organization_id)
        if not record.encrypted_refresh_token:
            return True
        # Decrypted value must not appear as plaintext in the file.
        try:
            plain = self.decrypt_token(record.encrypted_refresh_token)
        except ValueError:
            return True
        return plain not in text

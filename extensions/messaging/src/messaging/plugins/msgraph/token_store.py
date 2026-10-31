from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from cryptography.fernet import Fernet, InvalidToken


@dataclass
class ConnectionRecord:
    organization_id: str
    status: str  # disconnected | connecting | connected
    encrypted_refresh_token: str | None = None


class TokenStore(Protocol):
    def get(self, organization_id: str) -> ConnectionRecord: ...

    def save(self, record: ConnectionRecord) -> None: ...

    def encrypt_token(self, plaintext: str) -> str: ...

    def decrypt_token(self, ciphertext: str) -> str: ...


class FernetMixin:
    def __init__(self, *, token_key: bytes) -> None:
        self._fernet = Fernet(token_key)

    def encrypt_token(self, plaintext: str) -> str:
        return self._fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")

    def decrypt_token(self, ciphertext: str) -> str:
        try:
            return self._fernet.decrypt(ciphertext.encode("utf-8")).decode(
                "utf-8"
            )
        except InvalidToken as error:
            raise ValueError("invalid encrypted token") from error


class FileTokenStore(FernetMixin):
    """Org-scoped connection + Fernet-encrypted refresh tokens on disk (tests)."""

    def __init__(self, *, data_dir: str | Path, token_key: bytes) -> None:
        super().__init__(token_key=token_key)
        self._root = Path(data_dir)
        self._root.mkdir(parents=True, exist_ok=True)

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

    def plaintext_absent_from_disk(self, organization_id: str) -> bool:
        path = self._path(organization_id)
        if not path.exists():
            return True
        text = path.read_text()
        record = self.get(organization_id)
        if not record.encrypted_refresh_token:
            return True
        try:
            plain = self.decrypt_token(record.encrypted_refresh_token)
        except ValueError:
            return True
        return plain not in text


class NeonTokenStore(FernetMixin):
    """Org-scoped connection + Fernet-encrypted refresh tokens in Neon."""

    def __init__(self, *, postgres_url: str, token_key: bytes) -> None:
        super().__init__(token_key=token_key)
        self._postgres_url = postgres_url

    def _connect(self):
        import psycopg

        return psycopg.connect(self._postgres_url)

    def get(self, organization_id: str) -> ConnectionRecord:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT status, encrypted_refresh_token
                    FROM messaging.connection
                    WHERE organization_id = %s
                    """,
                    (organization_id,),
                )
                row = cur.fetchone()
        if row is None:
            return ConnectionRecord(
                organization_id=organization_id, status="disconnected"
            )
        return ConnectionRecord(
            organization_id=organization_id,
            status=str(row[0] or "disconnected"),
            encrypted_refresh_token=row[1],
        )

    def save(self, record: ConnectionRecord) -> None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO messaging.connection (
                        organization_id, status, encrypted_refresh_token, updated_at
                    )
                    VALUES (%s, %s, %s, NOW())
                    ON CONFLICT (organization_id) DO UPDATE SET
                        status = EXCLUDED.status,
                        encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
                        updated_at = NOW()
                    """,
                    (
                        record.organization_id,
                        record.status,
                        record.encrypted_refresh_token,
                    ),
                )
            conn.commit()

    def plaintext_absent_from_row(self, organization_id: str) -> bool:
        record = self.get(organization_id)
        if not record.encrypted_refresh_token:
            return True
        try:
            plain = self.decrypt_token(record.encrypted_refresh_token)
        except ValueError:
            return True
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT status, encrypted_refresh_token
                    FROM messaging.connection
                    WHERE organization_id = %s
                    """,
                    (organization_id,),
                )
                row = cur.fetchone()
        if row is None:
            return True
        blob = f"{row[0]}|{row[1] or ''}"
        return plain not in blob


def create_token_store(
    *,
    token_key: bytes,
    postgres_url: str | None = None,
    data_dir: str | Path | None = None,
) -> TokenStore:
    if postgres_url:
        return NeonTokenStore(postgres_url=postgres_url, token_key=token_key)
    if data_dir is None:
        raise ValueError("data_dir required when POSTGRES_URL is unset")
    return FileTokenStore(data_dir=data_dir, token_key=token_key)

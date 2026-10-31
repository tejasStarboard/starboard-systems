from __future__ import annotations

from dataclasses import dataclass

from .token_store import ConnectionRecord, TokenStore


@dataclass
class ConnectionStatus:
    organization_id: str
    status: str
    auth_url: str | None = None


class ConnectionService:
    """Connect state machine: disconnected → connecting → connected."""

    def __init__(self, store: TokenStore) -> None:
        self._store = store

    def status(self, organization_id: str) -> ConnectionStatus:
        record = self._store.get(organization_id)
        return ConnectionStatus(
            organization_id=organization_id, status=record.status
        )

    def start_connect(self, organization_id: str) -> ConnectionStatus:
        record = ConnectionRecord(
            organization_id=organization_id,
            status="connecting",
            encrypted_refresh_token=None,
        )
        self._store.save(record)
        # Stub OAuth URL — real Azure AD authorize URL wired via env later.
        auth_url = (
            f"/api/extensions/messaging.msgraph/connection/callback"
            f"?organizationId={organization_id}&code=stub"
        )
        return ConnectionStatus(
            organization_id=organization_id,
            status="connecting",
            auth_url=auth_url,
        )

    def complete_callback(
        self, organization_id: str, *, code: str
    ) -> ConnectionStatus:
        if not code:
            raise ValueError("code is required")
        # Stub: treat authorization code as the refresh-token material.
        encrypted = self._store.encrypt_token(f"refresh:{code}")
        record = ConnectionRecord(
            organization_id=organization_id,
            status="connected",
            encrypted_refresh_token=encrypted,
        )
        self._store.save(record)
        return ConnectionStatus(
            organization_id=organization_id, status="connected"
        )

    def disconnect(self, organization_id: str) -> ConnectionStatus:
        record = ConnectionRecord(
            organization_id=organization_id,
            status="disconnected",
            encrypted_refresh_token=None,
        )
        self._store.save(record)
        return ConnectionStatus(
            organization_id=organization_id, status="disconnected"
        )

    def require_access_token(self, organization_id: str) -> str:
        record = self._store.get(organization_id)
        if record.status != "connected" or not record.encrypted_refresh_token:
            raise ValueError("mailbox not connected")
        # Vertical slice: decrypted refresh material doubles as access token.
        return self._store.decrypt_token(record.encrypted_refresh_token)

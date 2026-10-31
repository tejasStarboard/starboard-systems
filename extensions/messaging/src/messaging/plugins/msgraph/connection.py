from __future__ import annotations

from dataclasses import dataclass

import httpx

from messaging.config import GraphMode, MessagingConfig

from .oauth import (
    OAuthConfig,
    build_authorize_url,
    exchange_code_for_tokens,
    refresh_access_token,
    stub_callback_path,
)
from .token_store import ConnectionRecord, TokenStore


@dataclass
class ConnectionStatus:
    organization_id: str
    status: str
    auth_url: str | None = None


class ConnectionService:
    """Connect state machine: disconnected → connecting → connected."""

    def __init__(
        self,
        store: TokenStore,
        *,
        graph_mode: GraphMode = "stub",
        oauth: OAuthConfig | None = None,
        http_transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._store = store
        self._graph_mode = graph_mode
        self._oauth = oauth
        self._http_transport = http_transport

    @classmethod
    def from_config(
        cls,
        store: TokenStore,
        config: MessagingConfig,
        *,
        http_transport: httpx.BaseTransport | None = None,
    ) -> ConnectionService:
        oauth: OAuthConfig | None = None
        if (
            config.graph_mode == "live"
            and config.ms_graph_client_id
            and config.ms_graph_client_secret
            and config.ms_graph_redirect_uri
        ):
            oauth = OAuthConfig(
                client_id=config.ms_graph_client_id,
                client_secret=config.ms_graph_client_secret,
                tenant_id=config.ms_graph_tenant_id,
                redirect_uri=config.ms_graph_redirect_uri,
            )
        return cls(
            store,
            graph_mode=config.graph_mode,
            oauth=oauth,
            http_transport=http_transport,
        )

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
        if self._graph_mode == "live":
            if self._oauth is None:
                raise ValueError(
                    "live Graph mode requires MS_GRAPH_CLIENT_ID, "
                    "MS_GRAPH_CLIENT_SECRET, and MS_GRAPH_REDIRECT_URI"
                )
            auth_url = build_authorize_url(
                self._oauth, organization_id=organization_id
            )
        else:
            auth_url = stub_callback_path(organization_id)
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
        if self._graph_mode == "live":
            if self._oauth is None:
                raise ValueError(
                    "live Graph mode requires Azure app configuration"
                )
            tokens = exchange_code_for_tokens(
                self._oauth,
                code=code,
                transport=self._http_transport,
            )
            refresh_plaintext = tokens["refresh_token"]
        else:
            # Stub: treat authorization code as the refresh-token material.
            refresh_plaintext = f"refresh:{code}"

        encrypted = self._store.encrypt_token(refresh_plaintext)
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
        refresh = self._store.decrypt_token(record.encrypted_refresh_token)
        if self._graph_mode == "live":
            if self._oauth is None:
                raise ValueError(
                    "live Graph mode requires Azure app configuration"
                )
            return refresh_access_token(
                self._oauth,
                refresh_token=refresh,
                transport=self._http_transport,
            )
        # Stub: decrypted refresh material doubles as access token.
        return refresh

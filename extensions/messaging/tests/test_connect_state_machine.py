from __future__ import annotations

from pathlib import Path
from urllib.parse import parse_qs, urlparse

import httpx
from cryptography.fernet import Fernet

from messaging.plugins.msgraph.connection import ConnectionService
from messaging.plugins.msgraph.oauth import OAuthConfig, encode_oauth_state
from messaging.plugins.msgraph.token_store import FileTokenStore


def _store(tmp_path: Path) -> FileTokenStore:
    return FileTokenStore(
        data_dir=tmp_path,
        token_key=Fernet.generate_key(),
    )


def test_connect_callback_disconnect_state_machine(tmp_path: Path) -> None:
    store = _store(tmp_path)
    service = ConnectionService(store)
    org = "org_test"

    assert service.status(org).status == "disconnected"

    started = service.start_connect(org)
    assert started.status == "connecting"
    assert started.auth_url is not None
    assert started.auth_url.startswith(
        "/api/extensions/messaging.msgraph/connection/callback"
    )
    assert service.status(org).status == "connecting"

    connected = service.complete_callback(org, code="auth-code-1")
    assert connected.status == "connected"
    record = store.get(org)
    assert record.status == "connected"
    assert record.encrypted_refresh_token is not None
    assert "auth-code-1" not in Path(
        tmp_path / "connection-org_test.json"
    ).read_text()
    assert store.plaintext_absent_from_disk(org) is True
    assert store.decrypt_token(record.encrypted_refresh_token) == (
        "refresh:auth-code-1"
    )

    disconnected = service.disconnect(org)
    assert disconnected.status == "disconnected"
    assert store.get(org).encrypted_refresh_token is None


def test_require_access_token_when_connected(tmp_path: Path) -> None:
    store = _store(tmp_path)
    service = ConnectionService(store)
    service.start_connect("org_a")
    service.complete_callback("org_a", code="xyz")
    token = service.require_access_token("org_a")
    assert token == "refresh:xyz"


def test_live_authorize_url_and_token_exchange(tmp_path: Path) -> None:
    store = _store(tmp_path)
    oauth = OAuthConfig(
        client_id="client-id",
        client_secret="client-secret",
        tenant_id="common",
        redirect_uri=(
            "http://localhost:3000/api/extensions/messaging.msgraph"
            "/connection/callback"
        ),
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert "oauth2/v2.0/token" in str(request.url)
        return httpx.Response(
            200,
            json={
                "access_token": "access-live",
                "refresh_token": "refresh-live",
                "token_type": "Bearer",
            },
        )

    transport = httpx.MockTransport(handler)
    service = ConnectionService(
        store, graph_mode="live", oauth=oauth, http_transport=transport
    )

    started = service.start_connect("org_live")
    assert started.auth_url is not None
    parsed = urlparse(started.auth_url)
    assert parsed.netloc == "login.microsoftonline.com"
    assert "/oauth2/v2.0/authorize" in parsed.path
    query = parse_qs(parsed.query)
    assert query["client_id"] == ["client-id"]
    assert "state" in query

    connected = service.complete_callback("org_live", code="auth-code")
    assert connected.status == "connected"
    record = store.get("org_live")
    assert store.decrypt_token(record.encrypted_refresh_token or "") == (
        "refresh-live"
    )

    access = service.require_access_token("org_live")
    assert access == "access-live"


def test_encode_oauth_state_round_trip() -> None:
    state = encode_oauth_state("org_abc", nonce="n1")
    from messaging.plugins.msgraph.oauth import decode_oauth_state

    assert decode_oauth_state(state) == "org_abc"

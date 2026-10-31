from __future__ import annotations

from pathlib import Path

from cryptography.fernet import Fernet

from messaging.plugins.msgraph.connection import ConnectionService
from messaging.plugins.msgraph.token_store import TokenStore


def _store(tmp_path: Path) -> TokenStore:
    return TokenStore(
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

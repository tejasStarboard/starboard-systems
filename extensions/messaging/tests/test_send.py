from __future__ import annotations

from pathlib import Path

from cryptography.fernet import Fernet
from fastapi.testclient import TestClient

from messaging.api import create_app
from messaging.config import MessagingConfig
from messaging.plugins.msgraph import FakeGraphClient
from messaging.plugins.msgraph.connection import ConnectionService
from messaging.plugins.msgraph.token_store import TokenStore


def _config(tmp_path: Path) -> MessagingConfig:
    key = Fernet.generate_key()
    return MessagingConfig(
        port=3202,
        service_token="test-service-token-16",
        temporal_address="localhost:7233",
        temporal_namespace="default",
        temporal_task_queue="messaging.msgraph",
        data_dir=str(tmp_path),
        token_key=key,
    )


def _client(tmp_path: Path, *, fail_send: bool = False) -> TestClient:
    graph = FakeGraphClient(fail_send=fail_send)
    app = create_app(
        config=_config(tmp_path),
        temporal_client=None,
        connect_temporal_on_startup=False,
        graph_client=graph,
    )
    return TestClient(app)


def _auth() -> dict[str, str]:
    return {"Authorization": "Bearer test-service-token-16"}


def _connect(client: TestClient, org: str = "org_send") -> None:
    start = client.post(
        "/extensions/messaging.msgraph/connection",
        headers=_auth(),
        json={"organizationId": org},
    )
    assert start.status_code == 200
    callback = client.post(
        "/extensions/messaging.msgraph/connection/callback",
        headers=_auth(),
        json={"organizationId": org, "code": "send-code"},
    )
    assert callback.status_code == 200
    assert callback.json()["status"] == "connected"


def test_send_uses_mock_graph(tmp_path: Path) -> None:
    graph = FakeGraphClient()
    app = create_app(
        config=_config(tmp_path),
        temporal_client=None,
        connect_temporal_on_startup=False,
        graph_client=graph,
    )
    client = TestClient(app)
    _connect(client)

    response = client.post(
        "/extensions/messaging.msgraph/send",
        headers=_auth(),
        json={
            "organizationId": "org_send",
            "toAddress": "customer@example.com",
            "subject": "Re: quote",
            "body": "Here is your quote",
            "quoteId": "q_1",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "sent"
    assert body["id"].startswith("sent_")
    assert len(graph.sent) == 1
    assert graph.sent[0].to_address == "customer@example.com"
    assert graph.sent[0].quote_id == "q_1"


def test_send_failure_surfaces_502(tmp_path: Path) -> None:
    client = _client(tmp_path, fail_send=True)
    _connect(client, org="org_fail")
    response = client.post(
        "/extensions/messaging.msgraph/send",
        headers=_auth(),
        json={
            "organizationId": "org_fail",
            "toAddress": "a@b.com",
            "subject": "x",
            "body": "y",
        },
    )
    assert response.status_code == 502
    assert "send failed" in response.json()["detail"]


def test_send_requires_connection(tmp_path: Path) -> None:
    client = _client(tmp_path)
    response = client.post(
        "/extensions/messaging.msgraph/send",
        headers=_auth(),
        json={
            "organizationId": "org_none",
            "toAddress": "a@b.com",
            "subject": "x",
            "body": "y",
        },
    )
    assert response.status_code == 400


def test_token_not_plaintext_after_connect(tmp_path: Path) -> None:
    config = _config(tmp_path)
    store = TokenStore(data_dir=config.data_dir, token_key=config.token_key)
    service = ConnectionService(store)
    service.start_connect("org_enc")
    service.complete_callback("org_enc", code="secret-code")
    assert store.plaintext_absent_from_disk("org_enc") is True

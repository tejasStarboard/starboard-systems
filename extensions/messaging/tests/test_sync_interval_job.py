from __future__ import annotations

import pytest
from cryptography.fernet import Fernet
from fastapi.testclient import TestClient

from messaging.api import create_app
from messaging.config import MessagingConfig
from messaging.plugins.msgraph.connection import ConnectionService
from messaging.plugins.msgraph.token_store import TokenStore


class _FakeHandle:
    def __init__(self) -> None:
        self.id = "messaging.msgraph.sync-test"
        self.first_execution_run_id = "run-1"
        self.started_input = None


class _FakeTemporal:
    def __init__(self) -> None:
        self.handle = _FakeHandle()

    async def start_workflow(self, *args, **kwargs):
        if len(args) > 1:
            self.handle.started_input = args[1]
        return self.handle


@pytest.fixture
def messaging_config(
    tmp_path, monkeypatch: pytest.MonkeyPatch
) -> MessagingConfig:
    key = Fernet.generate_key()
    monkeypatch.setenv("MESSAGING_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("MESSAGING_TOKEN_KEY", key.decode("utf-8"))
    return MessagingConfig(
        port=3202,
        service_token="test-token",
        temporal_address="localhost:7233",
        temporal_namespace="default",
        temporal_task_queue="messaging",
        data_dir=str(tmp_path),
        token_key=key,
    )


def test_enqueue_sync_passes_sync_interval_minutes(
    messaging_config: MessagingConfig, tmp_path
) -> None:
    store = TokenStore(
        data_dir=tmp_path, token_key=messaging_config.token_key
    )
    ConnectionService(store).complete_callback("org_sync", code="code")

    temporal = _FakeTemporal()
    app = create_app(
        config=messaging_config,
        temporal_client=temporal,  # type: ignore[arg-type]
        connect_temporal_on_startup=False,
    )
    with TestClient(app) as client:
        response = client.post(
            "/extensions/messaging.msgraph/jobs",
            headers={"Authorization": "Bearer test-token"},
            json={"organizationId": "org_sync", "syncIntervalMinutes": 45},
        )

    assert response.status_code == 202
    assert temporal.handle.started_input is not None
    assert temporal.handle.started_input.sync_interval_minutes == 45

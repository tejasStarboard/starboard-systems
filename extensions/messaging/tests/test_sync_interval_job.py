from __future__ import annotations

from datetime import timedelta

import pytest
from cryptography.fernet import Fernet
from fastapi.testclient import TestClient

from messaging.api import create_app
from messaging.config import MessagingConfig
from messaging.plugins.msgraph.connection import ConnectionService
from messaging.plugins.msgraph.token_store import FileTokenStore
from helpers import make_config


class _FakeHandle:
    def __init__(self) -> None:
        self.id = "messaging.msgraph.sync-test"
        self.first_execution_run_id = "run-1"
        self.started_input = None


class _FakeTemporal:
    def __init__(self) -> None:
        self.handle = _FakeHandle()
        self.schedules: dict[str, object] = {}

    async def create_schedule(self, schedule_id: str, schedule) -> None:
        self.schedules[schedule_id] = schedule

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
    return make_config(tmp_path, service_token="test-token", token_key=key)


def test_enqueue_sync_passes_sync_interval_and_upserts_schedule(
    messaging_config: MessagingConfig, tmp_path
) -> None:
    store = FileTokenStore(
        data_dir=tmp_path, token_key=messaging_config.token_key
    )
    ConnectionService(store).complete_callback("org_sync", code="code")

    temporal = _FakeTemporal()
    app = create_app(
        config=messaging_config,
        temporal_client=temporal,  # type: ignore[arg-type]
        connect_temporal_on_startup=False,
        token_store=store,
    )
    with TestClient(app) as client:
        response = client.post(
            "/extensions/messaging.msgraph/jobs",
            headers={"Authorization": "Bearer test-token"},
            json={"organizationId": "org_sync", "syncIntervalMinutes": 45},
        )

    assert response.status_code == 202
    body = response.json()
    assert body["scheduleId"] == "messaging.msgraph.sync-org_sync"
    assert temporal.handle.started_input is not None
    assert temporal.handle.started_input.sync_interval_minutes == 45
    schedule = temporal.schedules["messaging.msgraph.sync-org_sync"]
    interval = schedule.spec.intervals[0].every
    assert interval == timedelta(minutes=45)

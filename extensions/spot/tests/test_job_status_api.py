from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient
from temporalio.client import WorkflowExecutionStatus

from spot.api import create_app
from spot.config import SpotConfig


class _FakeHandle:
    def __init__(
        self,
        status: WorkflowExecutionStatus,
        result=None,
        error: str | None = None,
    ):
        self._status = status
        self._result = result
        self._error = error

    async def describe(self):
        return SimpleNamespace(status=self._status)

    async def result(self):
        if self._error:
            raise RuntimeError(self._error)
        return self._result


class _FakeTemporal:
    def __init__(self, handle: _FakeHandle):
        self._handle = handle

    def get_workflow_handle(self, workflow_id: str):
        assert workflow_id
        return self._handle


@pytest.fixture
def spot_config() -> SpotConfig:
    return SpotConfig(
        port=3203,
        service_token="test-token",
        temporal_address="localhost:7233",
        temporal_namespace="default",
        temporal_task_queue="spot",
    )


def test_get_job_status_completed(spot_config: SpotConfig) -> None:
    handle = _FakeHandle(
        WorkflowExecutionStatus.COMPLETED,
        result={"rates": [{"amount": 1}]},
    )
    app = create_app(
        config=spot_config,
        temporal_client=_FakeTemporal(handle),  # type: ignore[arg-type]
        connect_temporal_on_startup=False,
    )
    with TestClient(app) as client:
        response = client.get(
            "/extensions/spot.fake/jobs/wf-1",
            headers={"Authorization": "Bearer test-token"},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "completed"
    assert body["result"] == {"rates": [{"amount": 1}]}


def test_get_job_status_running(spot_config: SpotConfig) -> None:
    handle = _FakeHandle(WorkflowExecutionStatus.RUNNING)
    app = create_app(
        config=spot_config,
        temporal_client=_FakeTemporal(handle),  # type: ignore[arg-type]
        connect_temporal_on_startup=False,
    )
    with TestClient(app) as client:
        response = client.get(
            "/extensions/spot.fake/jobs/wf-1",
            headers={"Authorization": "Bearer test-token"},
        )
    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_get_job_status_unknown_plugin(spot_config: SpotConfig) -> None:
    app = create_app(
        config=spot_config,
        temporal_client=AsyncMock(),
        connect_temporal_on_startup=False,
    )
    with TestClient(app) as client:
        response = client.get(
            "/extensions/spot.unknown/jobs/wf-1",
            headers={"Authorization": "Bearer test-token"},
        )
    assert response.status_code == 404

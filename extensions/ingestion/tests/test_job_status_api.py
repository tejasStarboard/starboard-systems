from __future__ import annotations

from types import SimpleNamespace

from fastapi.testclient import TestClient
from temporalio.client import WorkflowExecutionStatus

from ingestion.api import create_app
from ingestion.config import IngestionConfig


class _FakeHandle:
    def __init__(self, status: WorkflowExecutionStatus, result=None):
        self._status = status
        self._result = result

    async def describe(self):
        return SimpleNamespace(status=self._status)

    async def result(self):
        return self._result


class _FakeTemporal:
    def __init__(self, handle: _FakeHandle):
        self._handle = handle

    def get_workflow_handle(self, workflow_id: str):
        return self._handle


def test_get_ingestion_job_status_completed(tmp_path) -> None:
    config = IngestionConfig(
        port=3201,
        service_token="test-token",
        temporal_address="localhost:7233",
        temporal_namespace="default",
        temporal_task_queue="ingestion",
        upload_dir=str(tmp_path),
        rates_service_url="http://localhost:3002",
    )
    handle = _FakeHandle(
        WorkflowExecutionStatus.COMPLETED,
        result={"accepted": 1, "rejected": 0},
    )
    app = create_app(
        config=config,
        temporal_client=_FakeTemporal(handle),  # type: ignore[arg-type]
        connect_temporal_on_startup=False,
    )
    with TestClient(app) as client:
        response = client.get(
            "/extensions/ingestion.fcl_v6/jobs/wf-ingest-1",
            headers={"Authorization": "Bearer test-token"},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "completed"
    assert body["result"] == {"accepted": 1, "rejected": 0}

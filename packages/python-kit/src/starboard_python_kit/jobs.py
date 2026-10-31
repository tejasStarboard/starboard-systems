"""Shared Temporal workflow job status for extension HTTP APIs."""

from __future__ import annotations

from typing import Any, Literal

from temporalio.client import Client, WorkflowExecutionStatus
from temporalio.service import RPCError

JobStatus = Literal["running", "completed", "failed", "cancelled"]

_STATUS_MAP: dict[WorkflowExecutionStatus, JobStatus] = {
    WorkflowExecutionStatus.RUNNING: "running",
    WorkflowExecutionStatus.CONTINUED_AS_NEW: "running",
    WorkflowExecutionStatus.COMPLETED: "completed",
    WorkflowExecutionStatus.FAILED: "failed",
    WorkflowExecutionStatus.CANCELED: "cancelled",
    WorkflowExecutionStatus.TERMINATED: "cancelled",
    WorkflowExecutionStatus.TIMED_OUT: "failed",
}


def map_workflow_status(status: WorkflowExecutionStatus) -> JobStatus:
    return _STATUS_MAP.get(status, "running")


async def describe_job(
    client: Client,
    workflow_id: str,
) -> dict[str, Any]:
    """Return `{ status, result?, error? }` for a Temporal workflow id."""
    handle = client.get_workflow_handle(workflow_id)
    try:
        description = await handle.describe()
    except RPCError as exc:
        return {"status": "failed", "error": str(exc)}

    status = map_workflow_status(description.status)
    payload: dict[str, Any] = {"status": status}

    if status == "completed":
        try:
            payload["result"] = await handle.result()
        except Exception as exc:  # noqa: BLE001 — surface to API clients
            payload["status"] = "failed"
            payload["error"] = str(exc)
    elif status == "failed":
        try:
            await handle.result()
        except Exception as exc:  # noqa: BLE001
            payload["error"] = str(exc)
        else:
            payload["error"] = "Workflow failed"
    elif status == "cancelled":
        payload["error"] = "Workflow cancelled"

    return payload

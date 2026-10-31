from __future__ import annotations

from temporalio.client import WorkflowExecutionStatus

from starboard_python_kit.jobs import map_workflow_status


def test_map_workflow_status() -> None:
    assert map_workflow_status(WorkflowExecutionStatus.RUNNING) == "running"
    assert map_workflow_status(WorkflowExecutionStatus.COMPLETED) == "completed"
    assert map_workflow_status(WorkflowExecutionStatus.FAILED) == "failed"
    assert map_workflow_status(WorkflowExecutionStatus.CANCELED) == "cancelled"
    assert map_workflow_status(WorkflowExecutionStatus.TERMINATED) == "cancelled"
    assert map_workflow_status(WorkflowExecutionStatus.TIMED_OUT) == "failed"
    assert (
        map_workflow_status(WorkflowExecutionStatus.CONTINUED_AS_NEW) == "running"
    )

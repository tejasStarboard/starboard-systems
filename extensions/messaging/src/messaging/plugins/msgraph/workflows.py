from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from . import activities


@dataclass
class SyncWorkflowInput:
    organization_id: str


@dataclass
class SyncWorkflowResult:
    status: str
    message_ids: list[str]


@workflow.defn(name="messaging.msgraph.sync")
class MsGraphSyncWorkflow:
    @workflow.run
    async def run(self, input: SyncWorkflowInput) -> SyncWorkflowResult:
        short = RetryPolicy(maximum_attempts=3)
        recorded: dict = await workflow.execute_activity(
            activities.sync_inbox_activity,
            input.organization_id,
            start_to_close_timeout=timedelta(seconds=60),
            retry_policy=short,
        )
        return SyncWorkflowResult(
            status="completed",
            message_ids=list(recorded.get("messageIds") or []),
        )

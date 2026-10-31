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
    sync_interval_minutes: int = 15


@dataclass
class SyncWorkflowResult:
    status: str
    message_ids: list[str]
    sync_interval_minutes: int = 15


@workflow.defn(name="messaging.msgraph.sync")
class MsGraphSyncWorkflow:
    @workflow.run
    async def run(self, input: SyncWorkflowInput) -> SyncWorkflowResult:
        short = RetryPolicy(maximum_attempts=3)
        recorded: dict = await workflow.execute_activity(
            activities.sync_inbox_activity,
            {
                "organizationId": input.organization_id,
                "syncIntervalMinutes": input.sync_interval_minutes,
            },
            start_to_close_timeout=timedelta(seconds=60),
            retry_policy=short,
        )
        return SyncWorkflowResult(
            status="completed",
            message_ids=list(recorded.get("messageIds") or []),
            sync_interval_minutes=int(
                recorded.get("syncIntervalMinutes") or input.sync_interval_minutes
            ),
        )

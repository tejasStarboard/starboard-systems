from __future__ import annotations

from datetime import timedelta

from temporalio.client import (
    Client,
    Schedule,
    ScheduleActionStartWorkflow,
    ScheduleIntervalSpec,
    ScheduleSpec,
    ScheduleUpdate,
    ScheduleUpdateInput,
)
from temporalio.service import RPCError, RPCStatusCode

from .workflows import MsGraphSyncWorkflow, SyncWorkflowInput


def sync_schedule_id(organization_id: str) -> str:
    return f"messaging.msgraph.sync-{organization_id}"


def _schedule(
    *,
    organization_id: str,
    sync_interval_minutes: int,
    task_queue: str,
) -> Schedule:
    minutes = max(1, sync_interval_minutes)
    return Schedule(
        action=ScheduleActionStartWorkflow(
            MsGraphSyncWorkflow.run,
            SyncWorkflowInput(
                organization_id=organization_id,
                sync_interval_minutes=minutes,
            ),
            id=f"{sync_schedule_id(organization_id)}-run",
            task_queue=task_queue,
        ),
        spec=ScheduleSpec(
            intervals=[
                ScheduleIntervalSpec(every=timedelta(minutes=minutes))
            ]
        ),
    )


async def upsert_sync_schedule(
    client: Client,
    *,
    organization_id: str,
    sync_interval_minutes: int,
    task_queue: str,
) -> str:
    schedule_id = sync_schedule_id(organization_id)
    schedule = _schedule(
        organization_id=organization_id,
        sync_interval_minutes=sync_interval_minutes,
        task_queue=task_queue,
    )
    try:
        await client.create_schedule(schedule_id, schedule)
    except RPCError as error:
        if error.status != RPCStatusCode.ALREADY_EXISTS:
            raise

        handle = client.get_schedule_handle(schedule_id)

        async def _updater(_input: ScheduleUpdateInput) -> ScheduleUpdate:
            return ScheduleUpdate(schedule=schedule)

        await handle.update(_updater)
    return schedule_id


async def delete_sync_schedule(
    client: Client, *, organization_id: str
) -> None:
    schedule_id = sync_schedule_id(organization_id)
    try:
        handle = client.get_schedule_handle(schedule_id)
        await handle.delete()
    except RPCError as error:
        if error.status == RPCStatusCode.NOT_FOUND:
            return
        raise

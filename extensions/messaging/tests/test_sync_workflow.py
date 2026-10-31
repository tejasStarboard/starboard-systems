from __future__ import annotations

from pathlib import Path

import pytest
from cryptography.fernet import Fernet
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from messaging.plugins.msgraph import MsGraphSyncWorkflow, SyncWorkflowInput
from messaging.plugins.msgraph import activities
from messaging.plugins.msgraph.connection import ConnectionService
from messaging.plugins.msgraph.message_store import MessageStore
from messaging.plugins.msgraph.token_store import TokenStore


@pytest.mark.asyncio
async def test_sync_workflow_records_messages(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    key = Fernet.generate_key()
    monkeypatch.setenv("MESSAGING_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("MESSAGING_TOKEN_KEY", key.decode("utf-8"))

    store = TokenStore(data_dir=tmp_path, token_key=key)
    ConnectionService(store).complete_callback(
        "org_sync", code="sync-code"
    )
    # complete_callback from disconnected works; also ensure connecting path:
    # already connected via callback after implicit disconnected.

    async with await WorkflowEnvironment.start_time_skipping() as env:
        async with Worker(
            env.client,
            task_queue="test-msgraph-sync",
            workflows=[MsGraphSyncWorkflow],
            activities=[activities.sync_inbox_activity],
        ):
            result = await env.client.execute_workflow(
                MsGraphSyncWorkflow.run,
                SyncWorkflowInput(
                    organization_id="org_sync",
                    sync_interval_minutes=30,
                ),
                id="test-sync",
                task_queue="test-msgraph-sync",
            )

    assert result.status == "completed"
    assert result.sync_interval_minutes == 30
    assert "msg_inbound_1" in result.message_ids
    messages = MessageStore(data_dir=tmp_path).list("org_sync")
    assert len(messages) >= 1
    assert messages[0].subject.startswith("RFQ")

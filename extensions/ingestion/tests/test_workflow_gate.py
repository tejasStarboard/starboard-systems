from __future__ import annotations

from pathlib import Path

import pytest
from temporalio import activity
from temporalio.client import WorkflowFailureError
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from ingestion.plugins.fcl_v6 import FclV6IngestWorkflow, activities
from ingestion.plugins.fcl_v6.workflows import IngestWorkflowInput

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"


@pytest.mark.asyncio
async def test_workflow_fails_on_gate_without_save() -> None:
    saved: list[dict] = []

    @activity.defn(name="fcl_v6.save")
    async def save_stub(organization_id: str, rates: list[dict]) -> dict:
        saved.append({"organization_id": organization_id, "rates": rates})
        return {"rateIds": ["should-not-happen"]}

    async with await WorkflowEnvironment.start_time_skipping() as env:
        async with Worker(
            env.client,
            task_queue="test-fcl-v6",
            workflows=[FclV6IngestWorkflow],
            activities=[
                activities.plan_activity,
                activities.extract_activity,
                activities.gate_activity,
                save_stub,
            ],
        ):
            with pytest.raises(WorkflowFailureError) as exc:
                await env.client.execute_workflow(
                    FclV6IngestWorkflow.run,
                    IngestWorkflowInput(
                        organization_id="org_test",
                        sheet_path=str(FIXTURES / "fcl_v6_gate_fail.csv"),
                    ),
                    id="test-gate-fail",
                    task_queue="test-fcl-v6",
                )
            cause = exc.value.cause
            assert cause is not None
            assert "gate fail" in str(cause).lower()
            assert saved == []


@pytest.mark.asyncio
async def test_workflow_happy_path_calls_save() -> None:
    saved: list[dict] = []

    @activity.defn(name="fcl_v6.save")
    async def save_stub(organization_id: str, rates: list[dict]) -> dict:
        saved.append({"organization_id": organization_id, "rates": rates})
        return {"rateIds": ["rate_1"]}

    async with await WorkflowEnvironment.start_time_skipping() as env:
        async with Worker(
            env.client,
            task_queue="test-fcl-v6-ok",
            workflows=[FclV6IngestWorkflow],
            activities=[
                activities.plan_activity,
                activities.extract_activity,
                activities.gate_activity,
                save_stub,
            ],
        ):
            result = await env.client.execute_workflow(
                FclV6IngestWorkflow.run,
                IngestWorkflowInput(
                    organization_id="org_test",
                    sheet_path=str(FIXTURES / "fcl_v6_sample.csv"),
                ),
                id="test-happy",
                task_queue="test-fcl-v6-ok",
            )
            assert result.status == "completed"
            assert result.rate_ids == ["rate_1"]
            assert len(saved) == 1
            assert saved[0]["organization_id"] == "org_test"

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from temporalio import workflow
from temporalio.common import RetryPolicy
from temporalio.exceptions import ApplicationError

with workflow.unsafe.imports_passed_through():
    from . import activities


@dataclass
class IngestWorkflowInput:
    organization_id: str
    sheet_path: str


@dataclass
class IngestWorkflowResult:
    status: str
    rate_ids: list[str]
    gate_reason: str | None = None


@workflow.defn(name="ingestion.fcl_v6.pipeline")
class FclV6IngestWorkflow:
    @workflow.run
    async def run(self, input: IngestWorkflowInput) -> IngestWorkflowResult:
        short = RetryPolicy(maximum_attempts=3)
        await workflow.execute_activity(
            activities.plan_activity,
            input.sheet_path,
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=short,
        )
        extracted: list[dict[str, Any]] = await workflow.execute_activity(
            activities.extract_activity,
            input.sheet_path,
            start_to_close_timeout=timedelta(seconds=60),
            retry_policy=short,
        )
        gate: dict[str, Any] = await workflow.execute_activity(
            activities.gate_activity,
            extracted,
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=1),
        )
        if not gate.get("ok"):
            reason = gate.get("reason") or "gate failed"
            # Non-retryable: failed gate must not save rates.
            raise ApplicationError(reason, type="GateFailed", non_retryable=True)

        saved: dict[str, Any] = await workflow.execute_activity(
            activities.save_activity,
            args=[input.organization_id, gate.get("rates") or []],
            start_to_close_timeout=timedelta(seconds=120),
            retry_policy=short,
        )
        return IngestWorkflowResult(
            status="completed",
            rate_ids=list(saved.get("rateIds") or []),
        )

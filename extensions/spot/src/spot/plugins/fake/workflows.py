from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from . import activities


@dataclass
class SearchWorkflowInput:
    organization_id: str
    plugin_id: str = "fake"
    origin: str | None = None
    destination: str | None = None
    mode: str = "fcl"
    live_strategy: bool | None = None


@dataclass
class SearchWorkflowResult:
    status: str
    rates: list[dict[str, Any]]
    error: dict[str, str] | None = None


@workflow.defn(name="spot.search")
class SpotSearchWorkflow:
    @workflow.run
    async def run(self, input: SearchWorkflowInput) -> SearchWorkflowResult:
        short = RetryPolicy(maximum_attempts=3)
        result: dict[str, Any] = await workflow.execute_activity(
            activities.search_activity,
            {
                "organizationId": input.organization_id,
                "pluginId": input.plugin_id,
                "origin": input.origin,
                "destination": input.destination,
                "mode": input.mode,
                "liveStrategy": input.live_strategy,
            },
            start_to_close_timeout=timedelta(seconds=60),
            retry_policy=short,
        )
        error = result.get("error")
        if error:
            return SearchWorkflowResult(
                status="failed",
                rates=[],
                error=dict(error) if isinstance(error, dict) else {"message": str(error)},
            )
        return SearchWorkflowResult(
            status="completed",
            rates=list(result.get("rates") or []),
        )

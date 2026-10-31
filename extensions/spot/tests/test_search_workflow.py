from __future__ import annotations

import pytest
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from spot.plugins.fake import activities
from spot.plugins.fake.workflows import SearchWorkflowInput, SpotSearchWorkflow


@pytest.mark.asyncio
async def test_search_workflow_returns_normalized_rates() -> None:
    async with await WorkflowEnvironment.start_time_skipping() as env:
        async with Worker(
            env.client,
            task_queue="test-spot-search",
            workflows=[SpotSearchWorkflow],
            activities=[activities.search_activity],
        ):
            result = await env.client.execute_workflow(
                SpotSearchWorkflow.run,
                SearchWorkflowInput(
                    organization_id="org_spot",
                    plugin_id="fake",
                    origin="SGSIN",
                    destination="NLRTM",
                ),
                id="test-spot-search",
                task_queue="test-spot-search",
            )

    assert result.status == "completed"
    assert len(result.rates) == 2
    assert result.rates[0]["source"] == "spot"
    assert result.rates[0]["origin"] == "SGSIN"
    assert result.rates[0]["destination"] == "NLRTM"
    assert result.rates[0]["amount"] == 1234.56
    assert result.rates[1]["label"] == "Fake spot alt SGSIN-NLRTM"

from __future__ import annotations

import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from spot.config import load_config
from spot.plugins.fake import activities
from spot.plugins.fake.workflows import SpotSearchWorkflow


async def run_worker() -> None:
    config = load_config()
    client = await Client.connect(
        config.temporal_address, namespace=config.temporal_namespace
    )
    worker = Worker(
        client,
        task_queue=config.temporal_task_queue,
        workflows=[SpotSearchWorkflow],
        activities=[activities.search_activity],
    )
    await worker.run()


def main() -> None:
    asyncio.run(run_worker())


if __name__ == "__main__":
    main()

from __future__ import annotations

import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from ingestion.config import load_config
from ingestion.plugins.fcl_v6 import FclV6IngestWorkflow
from ingestion.plugins.fcl_v6 import activities


async def run_worker() -> None:
    config = load_config()
    client = await Client.connect(
        config.temporal_address, namespace=config.temporal_namespace
    )
    worker = Worker(
        client,
        task_queue=config.temporal_task_queue,
        workflows=[FclV6IngestWorkflow],
        activities=[
            activities.plan_activity,
            activities.extract_activity,
            activities.gate_activity,
            activities.save_activity,
        ],
    )
    await worker.run()


def main() -> None:
    asyncio.run(run_worker())


if __name__ == "__main__":
    main()

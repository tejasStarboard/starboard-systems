from __future__ import annotations

import asyncio
import logging
import os

import uvicorn
from temporalio.client import Client
from temporalio.worker import Worker

from ingestion.api import create_app
from ingestion.config import load_config
from ingestion.plugins.fcl_v6 import FclV6IngestWorkflow, activities

logger = logging.getLogger("ingestion.dev")


async def _connect_temporal_forever(
    *,
    address: str,
    namespace: str,
    delay_s: float = 2.0,
    remind_every_s: float = 60.0,
) -> Client:
    attempt = 0
    last_remind_at = 0.0
    loop = asyncio.get_running_loop()
    while True:
        attempt += 1
        try:
            return await Client.connect(address, namespace=namespace)
        except Exception as error:  # noqa: BLE001 — local DX retry loop
            now = loop.time()
            if attempt == 1:
                logger.warning(
                    "Waiting for Temporal at %s (%s). "
                    "API is up; jobs enabled once Temporal is reachable "
                    "(pnpm dev starts @starboard/temporal, or run "
                    "`pnpm --filter @starboard/temporal dev`).",
                    address,
                    error,
                )
                last_remind_at = now
            elif now - last_remind_at >= remind_every_s:
                logger.warning(
                    "Still waiting for Temporal at %s (attempt %s)",
                    address,
                    attempt,
                )
                last_remind_at = now
            await asyncio.sleep(delay_s)


async def _run() -> None:
    config = load_config()
    # Defer Temporal connect so `pnpm dev` stays up while Temporal boots.
    app = create_app(
        config=config,
        temporal_client=None,
        connect_temporal_on_startup=False,
    )

    server = uvicorn.Server(
        uvicorn.Config(
            app,
            host=os.environ.get("INGESTION_HOST", "0.0.0.0"),
            port=config.port,
            log_level="info",
        )
    )

    async def run_worker_when_ready() -> None:
        client = await _connect_temporal_forever(
            address=config.temporal_address,
            namespace=config.temporal_namespace,
        )
        app.state.temporal_client = client
        logger.info(
            "Connected to Temporal at %s; starting worker on %s",
            config.temporal_address,
            config.temporal_task_queue,
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

    await asyncio.gather(server.serve(), run_worker_when_ready())


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    asyncio.run(_run())


if __name__ == "__main__":
    main()

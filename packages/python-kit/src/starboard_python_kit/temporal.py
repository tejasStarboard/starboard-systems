from __future__ import annotations

import os

from temporalio.client import Client

DEFAULT_TASK_QUEUE = "ingestion.fcl_v6"


def default_task_queue(env: dict[str, str] | None = None) -> str:
    source = env if env is not None else os.environ
    return source.get("TEMPORAL_TASK_QUEUE", DEFAULT_TASK_QUEUE)


async def connect_temporal_client(
    *,
    target_host: str | None = None,
    namespace: str | None = None,
) -> Client:
    host = target_host or os.environ.get("TEMPORAL_ADDRESS", "localhost:7233")
    ns = namespace or os.environ.get("TEMPORAL_NAMESPACE", "default")
    return await Client.connect(host, namespace=ns)

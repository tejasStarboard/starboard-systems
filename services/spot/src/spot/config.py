from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# Match Bun services: load monorepo root `.env`
_ROOT_DIR = Path(__file__).resolve().parents[4]
load_dotenv(_ROOT_DIR / ".env")


@dataclass(frozen=True)
class SpotConfig:
    port: int
    service_token: str
    temporal_address: str
    temporal_namespace: str
    temporal_task_queue: str


def load_config(env: dict[str, str] | None = None) -> SpotConfig:
    source = env if env is not None else os.environ
    service_token = source.get("INTERNAL_SERVICE_TOKEN")
    if not service_token:
        raise ValueError(
            "INTERNAL_SERVICE_TOKEN is required "
            f"(set in {_ROOT_DIR / '.env'} or the environment)"
        )

    return SpotConfig(
        port=int(source.get("SPOT_SERVICE_PORT", "3203")),
        service_token=service_token,
        temporal_address=source.get("TEMPORAL_ADDRESS", "localhost:7233"),
        temporal_namespace=source.get("TEMPORAL_NAMESPACE", "default"),
        temporal_task_queue=source.get("TEMPORAL_TASK_QUEUE", "spot.search"),
    )

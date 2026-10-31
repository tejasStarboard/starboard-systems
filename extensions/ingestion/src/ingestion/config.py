from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# Load monorepo root `.env` (extensions/ingestion/src/ingestion → ../../../../)
_ROOT_DIR = Path(__file__).resolve().parents[4]
load_dotenv(_ROOT_DIR / ".env")


@dataclass(frozen=True)
class IngestionConfig:
    port: int
    service_token: str
    rates_service_url: str
    temporal_address: str
    temporal_namespace: str
    temporal_task_queue: str
    upload_dir: str


def load_config(env: dict[str, str] | None = None) -> IngestionConfig:
    source = env if env is not None else os.environ
    service_token = source.get("INTERNAL_SERVICE_TOKEN")
    if not service_token:
        raise ValueError(
            "INTERNAL_SERVICE_TOKEN is required "
            f"(set in {_ROOT_DIR / '.env'} or the environment)"
        )

    return IngestionConfig(
        port=int(source.get("INGESTION_SERVICE_PORT", "3201")),
        service_token=service_token,
        rates_service_url=source.get(
            "RATES_SERVICE_URL", "http://127.0.0.1:3104"
        ),
        temporal_address=source.get("TEMPORAL_ADDRESS", "localhost:7233"),
        temporal_namespace=source.get("TEMPORAL_NAMESPACE", "default"),
        temporal_task_queue=source.get(
            "TEMPORAL_TASK_QUEUE", "ingestion.fcl_v6"
        ),
        upload_dir=source.get(
            "INGESTION_UPLOAD_DIR", "/tmp/starboard-ingestion-uploads"
        ),
    )

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from cryptography.fernet import Fernet
from dotenv import load_dotenv

# Match Bun services: load monorepo root `.env`
_ROOT_DIR = Path(__file__).resolve().parents[4]
load_dotenv(_ROOT_DIR / ".env")

# Shared local/dev Fernet key when MESSAGING_TOKEN_KEY is unset (API + activities).
DEFAULT_DEV_MESSAGING_TOKEN_KEY = (
    b"Ipf6jQffYSHyHrfFi3P7YyHc7SLzwKgoqfJ4zj20XOM="
)


@dataclass(frozen=True)
class MessagingConfig:
    port: int
    service_token: str
    temporal_address: str
    temporal_namespace: str
    temporal_task_queue: str
    data_dir: str
    token_key: bytes


def load_config(env: dict[str, str] | None = None) -> MessagingConfig:
    source = env if env is not None else os.environ
    service_token = source.get("INTERNAL_SERVICE_TOKEN")
    if not service_token:
        raise ValueError(
            "INTERNAL_SERVICE_TOKEN is required "
            f"(set in {_ROOT_DIR / '.env'} or the environment)"
        )

    raw_key = source.get("MESSAGING_TOKEN_KEY")
    token_key = (
        raw_key.encode("utf-8") if raw_key else DEFAULT_DEV_MESSAGING_TOKEN_KEY
    )

    # Validate key early so misconfig fails at boot.
    Fernet(token_key)

    return MessagingConfig(
        port=int(source.get("MESSAGING_SERVICE_PORT", "3202")),
        service_token=service_token,
        temporal_address=source.get("TEMPORAL_ADDRESS", "localhost:7233"),
        temporal_namespace=source.get("TEMPORAL_NAMESPACE", "default"),
        temporal_task_queue=source.get(
            "TEMPORAL_TASK_QUEUE", "messaging.msgraph"
        ),
        data_dir=source.get(
            "MESSAGING_DATA_DIR", "/tmp/starboard-messaging-data"
        ),
        token_key=token_key,
    )

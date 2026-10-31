from __future__ import annotations

from pathlib import Path

from cryptography.fernet import Fernet

from messaging.config import MessagingConfig


def make_config(
    tmp_path: Path,
    *,
    service_token: str = "test-token",
    graph_mode: str = "stub",
    postgres_url: str | None = None,
    ms_graph_client_id: str | None = None,
    ms_graph_client_secret: str | None = None,
    ms_graph_redirect_uri: str | None = None,
    token_key: bytes | None = None,
) -> MessagingConfig:
    key = token_key or Fernet.generate_key()
    return MessagingConfig(
        port=3202,
        service_token=service_token,
        temporal_address="localhost:7233",
        temporal_namespace="default",
        temporal_task_queue="messaging.msgraph",
        data_dir=str(tmp_path),
        token_key=key,
        postgres_url=postgres_url,
        graph_mode=graph_mode,  # type: ignore[arg-type]
        ms_graph_client_id=ms_graph_client_id,
        ms_graph_client_secret=ms_graph_client_secret,
        ms_graph_tenant_id="common",
        ms_graph_redirect_uri=ms_graph_redirect_uri,
    )

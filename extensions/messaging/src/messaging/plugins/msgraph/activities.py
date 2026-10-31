from __future__ import annotations

import os
from typing import Any

from temporalio import activity

from messaging.config import DEFAULT_DEV_MESSAGING_TOKEN_KEY, load_config
from messaging.plugins.msgraph.connection import ConnectionService
from messaging.plugins.msgraph.graph_client import (
    FakeGraphClient,
    GraphMessage,
    HttpGraphClient,
)
from messaging.plugins.msgraph.message_store import (
    StoredMessage,
    create_message_store,
)
from messaging.plugins.msgraph.token_store import create_token_store

RECENT_MESSAGE_LIMIT = 25


def _token_key() -> bytes:
    raw = os.environ.get("MESSAGING_TOKEN_KEY")
    if raw:
        return raw.encode("utf-8")
    return DEFAULT_DEV_MESSAGING_TOKEN_KEY


def _data_dir() -> str:
    return os.environ.get(
        "MESSAGING_DATA_DIR", "/tmp/starboard-messaging-data"
    )


def _default_inbox() -> list[GraphMessage]:
    return [
        GraphMessage(
            id="msg_inbound_1",
            subject="RFQ: Shanghai to LA",
            from_address="shipper@example.com",
            body_preview="Please quote 1x40HC CNSHA-USLAX",
        )
    ]


@activity.defn(name="msgraph.sync_inbox")
async def sync_inbox_activity(payload: str | dict[str, Any]) -> dict[str, Any]:
    if isinstance(payload, str):
        organization_id = payload
        sync_interval_minutes = 15
    else:
        organization_id = str(payload.get("organizationId") or "")
        raw_interval = payload.get("syncIntervalMinutes")
        sync_interval_minutes = (
            int(raw_interval)
            if isinstance(raw_interval, (int, float)) and int(raw_interval) > 0
            else 15
        )

    try:
        cfg = load_config()
        postgres_url = cfg.postgres_url
        graph_mode = cfg.graph_mode
    except ValueError:
        postgres_url = (os.environ.get("POSTGRES_URL") or "").strip() or None
        graph_mode = (
            "live"
            if (os.environ.get("MS_GRAPH_CLIENT_ID") or "").strip()
            and (os.environ.get("MS_GRAPH_CLIENT_SECRET") or "").strip()
            else "stub"
        )
        cfg = None

    store = create_token_store(
        token_key=_token_key(),
        postgres_url=postgres_url,
        data_dir=_data_dir(),
    )
    if cfg is not None:
        connection = ConnectionService.from_config(store, cfg)
    else:
        connection = ConnectionService(store, graph_mode=graph_mode)
    access_token = connection.require_access_token(organization_id)

    if graph_mode == "live":
        graph = HttpGraphClient()
    else:
        graph = FakeGraphClient(inbox=_default_inbox())

    messages = graph.list_recent_messages(
        access_token=access_token, limit=RECENT_MESSAGE_LIMIT
    )

    message_store = create_message_store(
        postgres_url=postgres_url, data_dir=_data_dir()
    )
    ids: list[str] = []
    for item in messages:
        saved = message_store.append(
            StoredMessage(
                id=item.id,
                organization_id=organization_id,
                subject=item.subject,
                from_address=item.from_address,
                body_preview=item.body_preview,
            )
        )
        ids.append(saved.id)
    return {
        "messageIds": ids,
        "syncIntervalMinutes": sync_interval_minutes,
    }

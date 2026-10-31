from __future__ import annotations

import os
from typing import Any

from temporalio import activity

from messaging.config import DEFAULT_DEV_MESSAGING_TOKEN_KEY
from messaging.plugins.msgraph.connection import ConnectionService
from messaging.plugins.msgraph.graph_client import FakeGraphClient, GraphMessage
from messaging.plugins.msgraph.message_store import MessageStore, StoredMessage
from messaging.plugins.msgraph.token_store import TokenStore


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

    store = TokenStore(data_dir=_data_dir(), token_key=_token_key())
    connection = ConnectionService(store)
    access_token = connection.require_access_token(organization_id)

    # Vertical slice uses FakeGraphClient with a fixed sample inbox.
    # Swap for HttpGraphClient when Azure credentials are configured.
    # sync_interval_minutes is job input for schedule wiring (063); also
    # bounds how many recent messages we pull this run.
    graph = FakeGraphClient(inbox=_default_inbox())
    message_limit = max(1, min(50, sync_interval_minutes))
    messages = graph.list_recent_messages(
        access_token=access_token, limit=message_limit
    )

    message_store = MessageStore(data_dir=_data_dir())
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

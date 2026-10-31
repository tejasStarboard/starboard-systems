from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Protocol


@dataclass
class StoredMessage:
    id: str
    organization_id: str
    subject: str
    from_address: str
    body_preview: str
    quote_id: str | None = None


class MessageStore(Protocol):
    def list(self, organization_id: str) -> list[StoredMessage]: ...

    def append(self, message: StoredMessage) -> StoredMessage: ...


class FileMessageStore:
    def __init__(self, *, data_dir: str | Path) -> None:
        self._root = Path(data_dir)
        self._root.mkdir(parents=True, exist_ok=True)

    def _path(self, organization_id: str) -> Path:
        safe = organization_id.replace("/", "_")
        return self._root / f"messages-{safe}.json"

    def list(self, organization_id: str) -> list[StoredMessage]:
        path = self._path(organization_id)
        if not path.exists():
            return []
        raw = json.loads(path.read_text())
        items = raw if isinstance(raw, list) else []
        return [
            StoredMessage(
                id=str(item["id"]),
                organization_id=organization_id,
                subject=str(item.get("subject") or ""),
                from_address=str(item.get("from_address") or ""),
                body_preview=str(item.get("body_preview") or ""),
                quote_id=item.get("quote_id"),
            )
            for item in items
            if isinstance(item, dict) and item.get("id")
        ]

    def append(self, message: StoredMessage) -> StoredMessage:
        existing = self.list(message.organization_id)
        by_id = {item.id: item for item in existing}
        by_id[message.id] = message
        path = self._path(message.organization_id)
        path.write_text(
            json.dumps([asdict(item) for item in by_id.values()], indent=2)
        )
        return message


class NeonMessageStore:
    def __init__(self, *, postgres_url: str) -> None:
        self._postgres_url = postgres_url

    def _connect(self):
        import psycopg

        return psycopg.connect(self._postgres_url)

    def list(self, organization_id: str) -> list[StoredMessage]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, subject, from_address, body_preview, quote_id
                    FROM messaging.message
                    WHERE organization_id = %s
                    ORDER BY updated_at DESC
                    """,
                    (organization_id,),
                )
                rows = cur.fetchall()
        return [
            StoredMessage(
                id=str(row[0]),
                organization_id=organization_id,
                subject=str(row[1] or ""),
                from_address=str(row[2] or ""),
                body_preview=str(row[3] or ""),
                quote_id=row[4],
            )
            for row in rows
        ]

    def append(self, message: StoredMessage) -> StoredMessage:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO messaging.message (
                        id, organization_id, subject, from_address,
                        body_preview, quote_id, updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (organization_id, id) DO UPDATE SET
                        subject = EXCLUDED.subject,
                        from_address = EXCLUDED.from_address,
                        body_preview = EXCLUDED.body_preview,
                        quote_id = EXCLUDED.quote_id,
                        updated_at = NOW()
                    """,
                    (
                        message.id,
                        message.organization_id,
                        message.subject,
                        message.from_address,
                        message.body_preview,
                        message.quote_id,
                    ),
                )
            conn.commit()
        return message


def create_message_store(
    *,
    postgres_url: str | None = None,
    data_dir: str | Path | None = None,
) -> MessageStore:
    if postgres_url:
        return NeonMessageStore(postgres_url=postgres_url)
    if data_dir is None:
        raise ValueError("data_dir required when POSTGRES_URL is unset")
    return FileMessageStore(data_dir=data_dir)

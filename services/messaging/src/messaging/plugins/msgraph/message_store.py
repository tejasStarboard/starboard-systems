from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass
class StoredMessage:
    id: str
    organization_id: str
    subject: str
    from_address: str
    body_preview: str
    quote_id: str | None = None


class MessageStore:
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

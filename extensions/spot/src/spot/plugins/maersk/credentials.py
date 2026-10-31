from __future__ import annotations

import json
import os
from typing import Any


class EnvMaerskCredentialPort:
    """Minimal org credential lookup from SPOT_MAERSK_CREDENTIALS JSON.

    Shape: ``{"org_id": {"username": "...", "password": "...", "customerCode": "..."}}``
    """

    def get(self, organization_id: str, carrier: str) -> dict[str, str] | None:
        if carrier != "maersk":
            return None
        raw = os.environ.get("SPOT_MAERSK_CREDENTIALS", "").strip()
        if not raw:
            return None
        try:
            parsed: Any = json.loads(raw)
        except json.JSONDecodeError:
            return None
        if not isinstance(parsed, dict):
            return None
        entry = parsed.get(organization_id)
        if not isinstance(entry, dict):
            return None
        out = {
            str(key): str(value)
            for key, value in entry.items()
            if value is not None and str(value).strip()
        }
        return out or None

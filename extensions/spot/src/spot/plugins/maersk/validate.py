from __future__ import annotations

from typing import Any

from spot.plugins.validate import stub_validate


async def validate_credentials(credentials: dict[str, str]) -> dict[str, Any]:
    return await stub_validate(credentials)

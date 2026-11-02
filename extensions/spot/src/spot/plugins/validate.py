from __future__ import annotations

import asyncio
from typing import Any


async def stub_validate(
    credentials: dict[str, str],
    *,
    sleep_seconds: float = 5,
) -> dict[str, Any]:
    """Placeholder carrier check. Real probes land with live strategies.

    Always returns ok. ``credentials`` is accepted so callers pass decrypted
    values, and this stub does not log them.
    """
    _ = credentials
    await asyncio.sleep(sleep_seconds)
    return {"ok": True}

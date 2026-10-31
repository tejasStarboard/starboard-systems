from __future__ import annotations

from typing import Any

from temporalio import activity

from spot.plugins.base import NoopCredentialPort, SearchRequest
from spot.plugins.registry import get_plugin


@activity.defn(name="spot.search")
async def search_activity(payload: dict[str, Any]) -> dict[str, Any]:
    plugin_id = str(payload.get("pluginId") or "fake")
    plugin = get_plugin(plugin_id)
    credentials = NoopCredentialPort().get(
        str(payload.get("organizationId") or ""),
        plugin_id,
    )
    origin = payload.get("origin")
    destination = payload.get("destination")
    request = SearchRequest(
        organization_id=str(payload.get("organizationId") or ""),
        origin=str(origin) if origin else None,
        destination=str(destination) if destination else None,
        mode=str(payload.get("mode") or "fcl"),
    )
    rates = plugin.search(request, credentials)
    return {"rates": [rate.to_dict() for rate in rates]}

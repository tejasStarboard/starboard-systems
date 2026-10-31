from __future__ import annotations

from typing import Any

from temporalio import activity

from spot.plugins.base import NoopCredentialPort, SearchRequest, SpotSearchError
from spot.plugins.cma.credentials import EnvCmaCredentialPort
from spot.plugins.maersk.credentials import EnvMaerskCredentialPort
from spot.plugins.registry import get_plugin


def _load_credentials(plugin_id: str, organization_id: str) -> dict[str, str] | None:
    if plugin_id == "maersk":
        return EnvMaerskCredentialPort().get(organization_id, "maersk")
    if plugin_id == "cma":
        return EnvCmaCredentialPort().get(organization_id, "cma")
    return NoopCredentialPort().get(organization_id, plugin_id)


@activity.defn(name="spot.search")
async def search_activity(payload: dict[str, Any]) -> dict[str, Any]:
    plugin_id = str(payload.get("pluginId") or "fake")
    plugin = get_plugin(plugin_id)
    organization_id = str(payload.get("organizationId") or "")
    credentials = _load_credentials(plugin_id, organization_id)
    origin = payload.get("origin")
    destination = payload.get("destination")
    request = SearchRequest(
        organization_id=organization_id,
        origin=str(origin) if origin else None,
        destination=str(destination) if destination else None,
        mode=str(payload.get("mode") or "fcl"),
    )
    try:
        rates = plugin.search(request, credentials)
    except SpotSearchError as exc:
        return {"rates": [], "error": exc.to_dict()}
    return {"rates": [rate.to_dict() for rate in rates]}

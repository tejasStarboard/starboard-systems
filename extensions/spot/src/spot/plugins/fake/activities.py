from __future__ import annotations

from typing import Any

from temporalio import activity

from spot.plugins.base import NoopCredentialPort, SearchRequest, SpotSearchError
from spot.plugins.cma.credentials import EnvCmaCredentialPort
from spot.plugins.maersk.credentials import EnvMaerskCredentialPort
from spot.plugins.maersk.plugin import MaerskSpotPlugin
from spot.plugins.maersk.strategy import resolve_strategy
from spot.plugins.registry import get_plugin


def _load_credentials(plugin_id: str, organization_id: str) -> dict[str, str] | None:
    if plugin_id == "maersk":
        return EnvMaerskCredentialPort().get(organization_id, "maersk")
    if plugin_id == "cma":
        return EnvCmaCredentialPort().get(organization_id, "cma")
    return NoopCredentialPort().get(organization_id, plugin_id)


def _resolve_plugin(plugin_id: str, live_strategy: bool | None):
    if plugin_id == "maersk" and live_strategy is not None:
        return MaerskSpotPlugin(
            strategy=resolve_strategy("live" if live_strategy else "fixture")
        )
    return get_plugin(plugin_id)


@activity.defn(name="spot.search")
async def search_activity(payload: dict[str, Any]) -> dict[str, Any]:
    plugin_id = str(payload.get("pluginId") or "fake")
    live_raw = payload.get("liveStrategy")
    live_strategy = live_raw if isinstance(live_raw, bool) else None
    plugin = _resolve_plugin(plugin_id, live_strategy)
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

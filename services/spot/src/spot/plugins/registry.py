from __future__ import annotations

from spot.plugins.base import SpotPlugin
from spot.plugins.fake.plugin import FakeSpotPlugin

_PLUGIN_REGISTRY: dict[str, SpotPlugin] = {
    FakeSpotPlugin.id: FakeSpotPlugin(),
}


def list_plugin_ids() -> list[str]:
    return sorted(_PLUGIN_REGISTRY.keys())


def get_plugin(plugin_id: str) -> SpotPlugin:
    plugin = _PLUGIN_REGISTRY.get(plugin_id)
    if plugin is None:
        raise KeyError(f"Unknown spot plugin: {plugin_id}")
    return plugin

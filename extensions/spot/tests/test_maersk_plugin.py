from __future__ import annotations

from pathlib import Path

import pytest

from spot.plugins.base import SearchRequest
from spot.plugins.maersk.errors import MaerskSearchError
from spot.plugins.maersk.plugin import MaerskSpotPlugin
from spot.plugins.maersk.strategy import FixtureOfferStrategy
from spot.plugins.registry import get_plugin, list_plugin_ids

_FIXTURE = (
    Path(__file__).resolve().parent / "fixtures" / "maersk" / "productoffers_sample.json"
)


def test_registry_loads_maersk_by_id() -> None:
    assert "maersk" in list_plugin_ids()
    plugin = get_plugin("maersk")
    assert plugin.id == "maersk"


def test_maersk_search_returns_normalized_rates_from_fixture() -> None:
    plugin = MaerskSpotPlugin(strategy=FixtureOfferStrategy(fixture_path=_FIXTURE))
    request = SearchRequest(
        organization_id="org_test",
        origin="CNSHA",
        destination="NLRTM",
        mode="fcl",
    )
    rates = plugin.search(
        request,
        credentials={"username": "demo", "password": "secret"},
    )
    assert len(rates) >= 1
    assert rates[0].source == "spot"
    assert rates[0].carrier == "MAERSK"
    assert rates[0].origin == "CNSHA"
    assert rates[0].destination == "NLRTM"
    assert rates[0].amount == 5287.0
    assert rates[0].currency_code == "USD"
    assert rates[0].to_dict()["currencyCode"] == "USD"


def test_maersk_search_requires_credentials() -> None:
    plugin = MaerskSpotPlugin(strategy=FixtureOfferStrategy(fixture_path=_FIXTURE))
    request = SearchRequest(
        organization_id="org_test",
        origin="CNSHA",
        destination="NLRTM",
    )
    with pytest.raises(MaerskSearchError, match="credentials") as exc_info:
        plugin.search(request, credentials=None)
    assert exc_info.value.code == "missing_credentials"

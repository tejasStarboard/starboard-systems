from __future__ import annotations

from pathlib import Path

import pytest

from spot.plugins.base import SearchRequest
from spot.plugins.cma.errors import CmaSearchError
from spot.plugins.cma.plugin import CmaSpotPlugin
from spot.plugins.cma.strategy import FixtureOfferStrategy
from spot.plugins.registry import get_plugin, list_plugin_ids

_FIXTURE = Path(__file__).resolve().parent / "fixtures" / "cma" / "quotes_sample.json"


def test_registry_loads_cma_by_id() -> None:
    assert "cma" in list_plugin_ids()
    plugin = get_plugin("cma")
    assert plugin.id == "cma"


def test_cma_search_returns_normalized_rates_from_fixture() -> None:
    plugin = CmaSpotPlugin(strategy=FixtureOfferStrategy(fixture_path=_FIXTURE))
    request = SearchRequest(
        organization_id="org_test",
        origin="CNSHA",
        destination="NLRTM",
        mode="fcl",
    )
    rates = plugin.search(
        request,
        credentials={"apiKey": "demo", "clientId": "client"},
    )
    assert len(rates) >= 1
    assert rates[0].source == "spot"
    assert rates[0].carrier == "CMACGM"
    assert rates[0].origin == "CNSHA"
    assert rates[0].destination == "NLRTM"
    assert rates[0].amount == 4125.0
    assert rates[0].currency_code == "USD"
    assert rates[0].to_dict()["currencyCode"] == "USD"


def test_cma_search_requires_credentials() -> None:
    plugin = CmaSpotPlugin(strategy=FixtureOfferStrategy(fixture_path=_FIXTURE))
    request = SearchRequest(
        organization_id="org_test",
        origin="CNSHA",
        destination="NLRTM",
    )
    with pytest.raises(CmaSearchError, match="credentials") as exc_info:
        plugin.search(request, credentials=None)
    assert exc_info.value.code == "missing_credentials"

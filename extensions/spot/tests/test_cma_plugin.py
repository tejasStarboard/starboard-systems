from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest

from spot.plugins.base import SearchRequest
from spot.plugins.cma.errors import CmaSearchError
from spot.plugins.cma.plugin import CmaSpotPlugin
from spot.plugins.cma.strategy import FixtureOfferStrategy, LiveOfferStrategy
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


def test_cma_live_search_returns_normalized_rates_from_mock_http() -> None:
    fixture = json.loads(_FIXTURE.read_text(encoding="utf-8"))

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert request.url.path.endswith("/instant-quoting/quotes")
        assert request.headers.get("x-api-key") == "demo"
        assert request.headers.get("x-client-id") == "client"
        return httpx.Response(200, json=fixture)

    plugin = CmaSpotPlugin(
        strategy=LiveOfferStrategy(
            base_url="https://cma.test",
            client=httpx.Client(transport=httpx.MockTransport(handler)),
        )
    )
    rates = plugin.search(
        SearchRequest(
            organization_id="org_test",
            origin="CNSHA",
            destination="NLRTM",
            mode="fcl",
        ),
        credentials={"apiKey": "demo", "clientId": "client"},
    )
    assert len(rates) >= 1
    assert rates[0].carrier == "CMACGM"
    assert rates[0].amount == 4125.0


def test_cma_live_http_error_is_structured() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        _ = request
        return httpx.Response(401, text="unauthorized")

    plugin = CmaSpotPlugin(
        strategy=LiveOfferStrategy(
            base_url="https://cma.test",
            client=httpx.Client(transport=httpx.MockTransport(handler)),
        )
    )
    with pytest.raises(CmaSearchError) as exc_info:
        plugin.search(
            SearchRequest(
                organization_id="org_test",
                origin="CNSHA",
                destination="NLRTM",
            ),
            credentials={"apiKey": "demo", "clientId": "client"},
        )
    assert exc_info.value.code == "carrier_error"


@pytest.mark.asyncio
async def test_search_activity_cma_live_strategy_and_fixture(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from spot.plugins.cma import strategy as cma_strategy
    from spot.plugins.fake import activities

    fixture = json.loads(_FIXTURE.read_text(encoding="utf-8"))

    def handler(request: httpx.Request) -> httpx.Response:
        _ = request
        return httpx.Response(200, json=fixture)

    monkeypatch.setenv(
        "SPOT_CMA_CREDENTIALS",
        json.dumps({"org_test": {"apiKey": "demo", "clientId": "client"}}),
    )
    monkeypatch.setenv("SPOT_CMA_FIXTURE_PATH", str(_FIXTURE))

    original_live = cma_strategy.LiveOfferStrategy

    def live_with_mock(**kwargs: object) -> cma_strategy.LiveOfferStrategy:
        _ = kwargs
        return original_live(
            base_url="https://cma.test",
            client=httpx.Client(transport=httpx.MockTransport(handler)),
        )

    monkeypatch.setattr(cma_strategy, "LiveOfferStrategy", live_with_mock)

    live = await activities.search_activity(
        {
            "organizationId": "org_test",
            "pluginId": "cma",
            "origin": "CNSHA",
            "destination": "NLRTM",
            "mode": "fcl",
            "liveStrategy": True,
        }
    )
    assert live.get("error") is None
    assert len(live["rates"]) >= 1
    assert live["rates"][0]["carrier"] == "CMACGM"

    fixture_result = await activities.search_activity(
        {
            "organizationId": "org_test",
            "pluginId": "cma",
            "origin": "CNSHA",
            "destination": "NLRTM",
            "mode": "fcl",
            "liveStrategy": False,
        }
    )
    assert len(fixture_result["rates"]) >= 1
    assert fixture_result.get("error") is None

from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest

from spot.plugins.base import SearchRequest
from spot.plugins.maersk.errors import MaerskSearchError
from spot.plugins.maersk.plugin import MaerskSpotPlugin
from spot.plugins.maersk.strategy import FixtureOfferStrategy, LiveOfferStrategy
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


def test_maersk_live_search_returns_normalized_rates_from_mock_http() -> None:
    fixture = json.loads(_FIXTURE.read_text(encoding="utf-8"))

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert request.url.path.endswith("/products/productoffers")
        assert request.headers.get("authorization", "").startswith("Basic ")
        return httpx.Response(200, json=fixture)

    transport = httpx.MockTransport(handler)
    client = httpx.Client(transport=transport, base_url="https://maersk.test")
    plugin = MaerskSpotPlugin(
        strategy=LiveOfferStrategy(
            base_url="https://maersk.test",
            client=client,
        )
    )
    rates = plugin.search(
        SearchRequest(
            organization_id="org_test",
            origin="CNSHA",
            destination="NLRTM",
            mode="fcl",
        ),
        credentials={
            "username": "demo",
            "password": "secret",
            "customerCode": "C1",
        },
    )
    assert len(rates) >= 1
    assert rates[0].carrier == "MAERSK"
    assert rates[0].amount == 5287.0


def test_maersk_live_http_error_is_structured() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        _ = request
        return httpx.Response(503, text="unavailable")

    plugin = MaerskSpotPlugin(
        strategy=LiveOfferStrategy(
            base_url="https://maersk.test",
            client=httpx.Client(transport=httpx.MockTransport(handler)),
        )
    )
    with pytest.raises(MaerskSearchError) as exc_info:
        plugin.search(
            SearchRequest(
                organization_id="org_test",
                origin="CNSHA",
                destination="NLRTM",
            ),
            credentials={"username": "demo", "password": "secret"},
        )
    assert exc_info.value.code == "carrier_error"


@pytest.mark.asyncio
async def test_search_activity_live_strategy_uses_http_and_fixture_fallback(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from spot.plugins.fake import activities
    from spot.plugins.maersk import strategy as maersk_strategy

    fixture = json.loads(_FIXTURE.read_text(encoding="utf-8"))

    def handler(request: httpx.Request) -> httpx.Response:
        _ = request
        return httpx.Response(200, json=fixture)

    monkeypatch.setenv(
        "SPOT_MAERSK_CREDENTIALS",
        json.dumps({"org_test": {"username": "demo", "password": "secret"}}),
    )
    monkeypatch.setenv("SPOT_MAERSK_FIXTURE_PATH", str(_FIXTURE))
    monkeypatch.setenv("SPOT_MAERSK_API_BASE_URL", "https://maersk.test")

    original_live = maersk_strategy.LiveOfferStrategy

    def live_with_mock(**kwargs: object) -> maersk_strategy.LiveOfferStrategy:
        _ = kwargs
        return original_live(
            base_url="https://maersk.test",
            client=httpx.Client(transport=httpx.MockTransport(handler)),
        )

    monkeypatch.setattr(maersk_strategy, "LiveOfferStrategy", live_with_mock)

    live = await activities.search_activity(
        {
            "organizationId": "org_test",
            "pluginId": "maersk",
            "origin": "CNSHA",
            "destination": "NLRTM",
            "mode": "fcl",
            "liveStrategy": True,
        }
    )
    assert live.get("error") is None
    assert len(live["rates"]) >= 1
    assert live["rates"][0]["carrier"] == "MAERSK"

    fixture_result = await activities.search_activity(
        {
            "organizationId": "org_test",
            "pluginId": "maersk",
            "origin": "CNSHA",
            "destination": "NLRTM",
            "mode": "fcl",
            "liveStrategy": False,
        }
    )
    assert len(fixture_result["rates"]) >= 1
    assert fixture_result.get("error") is None

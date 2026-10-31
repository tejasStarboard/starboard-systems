from __future__ import annotations

import pytest

from spot.plugins.base import SearchRequest
from spot.plugins.registry import get_plugin, list_plugin_ids


def test_registry_loads_fake_by_id() -> None:
    assert "fake" in list_plugin_ids()
    plugin = get_plugin("fake")
    assert plugin.id == "fake"


def test_registry_rejects_unknown_plugin() -> None:
    with pytest.raises(KeyError, match="Unknown spot plugin"):
        get_plugin("hapag")


def test_fake_plugin_returns_deterministic_rates() -> None:
    plugin = get_plugin("fake")
    request = SearchRequest(
        organization_id="org_test",
        origin="CNSHA",
        destination="USLAX",
        mode="fcl",
    )
    rates = plugin.search(request, credentials=None)
    assert len(rates) == 2
    assert rates[0].amount == 1234.56
    assert rates[0].source == "spot"
    assert rates[0].carrier == "FAKE"
    assert rates[0].origin == "CNSHA"
    assert rates[0].destination == "USLAX"
    assert rates[0].label == "Fake spot CNSHA-USLAX"
    assert rates[1].amount == 1450.0
    assert rates[1].to_dict()["currencyCode"] == "USD"

from __future__ import annotations

from spot.plugins.base import NormalizedRate, SearchRequest


class FakeSpotPlugin:
    """Deterministic carrier plugin for host / Temporal tests."""

    id = "fake"

    def search(
        self,
        request: SearchRequest,
        credentials: dict[str, str] | None,
    ) -> list[NormalizedRate]:
        _ = credentials
        origin = request.origin or "CNSHA"
        destination = request.destination or "USLAX"
        return [
            NormalizedRate(
                origin=origin,
                destination=destination,
                carrier="FAKE",
                label=f"Fake spot {origin}-{destination}",
                currency_code="USD",
                amount=1234.56,
                valid_from="2026-01-01",
                valid_to="2026-12-31",
                source="spot",
                mode=request.mode or "fcl",
            ),
            NormalizedRate(
                origin=origin,
                destination=destination,
                carrier="FAKE",
                label=f"Fake spot alt {origin}-{destination}",
                currency_code="USD",
                amount=1450.0,
                valid_from="2026-01-01",
                valid_to="2026-06-30",
                source="spot",
                mode=request.mode or "fcl",
            ),
        ]

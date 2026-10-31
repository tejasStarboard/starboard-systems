from __future__ import annotations

from spot.plugins.base import NormalizedRate, SearchRequest
from spot.plugins.cma.errors import CmaSearchError
from spot.plugins.cma.normalize import normalize_quotes
from spot.plugins.cma.strategy import OfferStrategy, resolve_strategy


class CmaSpotPlugin:
    """CMA CGM carrier plugin — fixture API strategy by default."""

    id = "cma"

    def __init__(self, strategy: OfferStrategy | None = None) -> None:
        self._strategy = strategy or resolve_strategy()

    def search(
        self,
        request: SearchRequest,
        credentials: dict[str, str] | None,
    ) -> list[NormalizedRate]:
        if not credentials:
            raise CmaSearchError(
                "missing_credentials",
                "CMA credentials are required for this organization",
            )
        payload = self._strategy.fetch(request, credentials)
        rates = normalize_quotes(
            payload,
            origin=request.origin,
            destination=request.destination,
            mode=request.mode or "fcl",
        )
        if not rates:
            raise CmaSearchError(
                "no_rates",
                "CMA returned no priced quotes for this lane",
            )
        return rates

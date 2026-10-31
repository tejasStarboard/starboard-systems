from __future__ import annotations

from spot.plugins.base import NormalizedRate, SearchRequest
from spot.plugins.maersk.errors import MaerskSearchError
from spot.plugins.maersk.normalize import normalize_product_offers
from spot.plugins.maersk.strategy import OfferStrategy, resolve_strategy


class MaerskSpotPlugin:
    """Maersk carrier plugin — fixture strategy by default."""

    id = "maersk"

    def __init__(self, strategy: OfferStrategy | None = None) -> None:
        self._strategy = strategy or resolve_strategy()

    def search(
        self,
        request: SearchRequest,
        credentials: dict[str, str] | None,
    ) -> list[NormalizedRate]:
        if not credentials:
            raise MaerskSearchError(
                "missing_credentials",
                "Maersk credentials are required for this organization",
            )
        payload = self._strategy.fetch(request, credentials)
        rates = normalize_product_offers(
            payload,
            origin=request.origin,
            destination=request.destination,
            mode=request.mode or "fcl",
        )
        if not rates:
            raise MaerskSearchError(
                "no_rates",
                "Maersk returned no priced offers for this lane",
            )
        return rates

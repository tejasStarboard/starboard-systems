from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Protocol

import httpx

from spot.plugins.base import SearchRequest
from spot.plugins.maersk.errors import MaerskSearchError

_DEFAULT_FIXTURE = (
    Path(__file__).resolve().parents[4]
    / "tests"
    / "fixtures"
    / "maersk"
    / "productoffers_sample.json"
)

_DEFAULT_LIVE_BASE_URL = "https://api.maersk.com"


class OfferStrategy(Protocol):
    def fetch(
        self,
        request: SearchRequest,
        credentials: dict[str, str],
    ) -> dict[str, Any]:
        ...


class FixtureOfferStrategy:
    """Load recorded productoffers JSON — no live network."""

    def __init__(self, fixture_path: Path | None = None) -> None:
        self.fixture_path = fixture_path or Path(
            os.environ.get("SPOT_MAERSK_FIXTURE_PATH", str(_DEFAULT_FIXTURE))
        )

    def fetch(
        self,
        request: SearchRequest,
        credentials: dict[str, str],
    ) -> dict[str, Any]:
        _ = request, credentials
        if not self.fixture_path.is_file():
            raise MaerskSearchError(
                "fixture_missing",
                f"Maersk fixture not found: {self.fixture_path}",
            )
        try:
            payload = json.loads(self.fixture_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise MaerskSearchError(
                "fixture_invalid",
                f"Maersk fixture unreadable: {exc}",
            ) from exc
        if not isinstance(payload, dict):
            raise MaerskSearchError(
                "fixture_invalid",
                "Maersk fixture root must be a JSON object",
            )
        return payload


class LiveOfferStrategy:
    """HTTPS product-offers client (no Camoufox). CI mocks via injected client."""

    def __init__(
        self,
        *,
        base_url: str | None = None,
        client: httpx.Client | None = None,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = (
            base_url
            or os.environ.get("SPOT_MAERSK_API_BASE_URL")
            or _DEFAULT_LIVE_BASE_URL
        ).rstrip("/")
        self._client = client
        self._timeout = timeout

    def fetch(
        self,
        request: SearchRequest,
        credentials: dict[str, str],
    ) -> dict[str, Any]:
        if not request.origin or not request.destination:
            raise MaerskSearchError(
                "invalid_request",
                "Maersk live search requires origin and destination",
            )
        username = credentials.get("username", "").strip()
        password = credentials.get("password", "").strip()
        customer_code = credentials.get("customerCode", "").strip()
        if not username or not password:
            raise MaerskSearchError(
                "missing_credentials",
                "Maersk live search requires username and password",
            )

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        if customer_code:
            headers["X-Customer-Code"] = customer_code

        body = {
            "origin": request.origin,
            "destination": request.destination,
            "mode": request.mode or "fcl",
        }
        url = f"{self.base_url}/products/productoffers"

        owns_client = self._client is None
        client = self._client or httpx.Client(timeout=self._timeout)
        try:
            response = client.post(
                url,
                json=body,
                headers=headers,
                auth=(username, password),
            )
        except httpx.HTTPError as exc:
            raise MaerskSearchError(
                "carrier_error",
                f"Maersk live request failed: {exc}",
            ) from exc
        finally:
            if owns_client:
                client.close()

        if response.status_code >= 400:
            raise MaerskSearchError(
                "carrier_error",
                f"Maersk live HTTP {response.status_code}",
            )
        try:
            payload = response.json()
        except ValueError as exc:
            raise MaerskSearchError(
                "carrier_error",
                "Maersk live response was not JSON",
            ) from exc
        if not isinstance(payload, dict):
            raise MaerskSearchError(
                "carrier_error",
                "Maersk live response root must be a JSON object",
            )
        return payload


def resolve_strategy(name: str | None = None) -> OfferStrategy:
    strategy = (name or os.environ.get("SPOT_MAERSK_STRATEGY") or "fixture").strip().lower()
    if strategy == "live":
        return LiveOfferStrategy()
    return FixtureOfferStrategy()

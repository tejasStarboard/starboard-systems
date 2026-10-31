from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Protocol

import httpx

from spot.plugins.base import SearchRequest
from spot.plugins.cma.errors import CmaSearchError

_DEFAULT_FIXTURE = (
    Path(__file__).resolve().parents[4]
    / "tests"
    / "fixtures"
    / "cma"
    / "quotes_sample.json"
)

_DEFAULT_LIVE_BASE_URL = "https://api.cma-cgm.com"


class OfferStrategy(Protocol):
    def fetch(
        self,
        request: SearchRequest,
        credentials: dict[str, str],
    ) -> dict[str, Any]:
        ...


class FixtureOfferStrategy:
    """Load recorded Instant Quoting API JSON — no live network."""

    def __init__(self, fixture_path: Path | None = None) -> None:
        self.fixture_path = fixture_path or Path(
            os.environ.get("SPOT_CMA_FIXTURE_PATH", str(_DEFAULT_FIXTURE))
        )

    def fetch(
        self,
        request: SearchRequest,
        credentials: dict[str, str],
    ) -> dict[str, Any]:
        _ = request, credentials
        if not self.fixture_path.is_file():
            raise CmaSearchError(
                "fixture_missing",
                f"CMA fixture not found: {self.fixture_path}",
            )
        try:
            payload = json.loads(self.fixture_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise CmaSearchError(
                "fixture_invalid",
                f"CMA fixture unreadable: {exc}",
            ) from exc
        if not isinstance(payload, dict):
            raise CmaSearchError(
                "fixture_invalid",
                "CMA fixture root must be a JSON object",
            )
        return payload


class LiveOfferStrategy:
    """HTTPS Instant Quoting–style client. CI mocks via injected client."""

    def __init__(
        self,
        *,
        base_url: str | None = None,
        client: httpx.Client | None = None,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = (
            base_url
            or os.environ.get("SPOT_CMA_API_BASE_URL")
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
            raise CmaSearchError(
                "invalid_request",
                "CMA live search requires origin and destination",
            )
        api_key = credentials.get("apiKey", "").strip()
        client_id = credentials.get("clientId", "").strip()
        if not api_key or not client_id:
            raise CmaSearchError(
                "missing_credentials",
                "CMA live search requires apiKey and clientId",
            )

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-API-Key": api_key,
            "X-Client-Id": client_id,
        }
        body = {
            "origin": request.origin,
            "destination": request.destination,
            "mode": request.mode or "fcl",
        }
        url = f"{self.base_url}/instant-quoting/quotes"

        owns_client = self._client is None
        client = self._client or httpx.Client(timeout=self._timeout)
        try:
            response = client.post(url, json=body, headers=headers)
        except httpx.HTTPError as exc:
            raise CmaSearchError(
                "carrier_error",
                f"CMA live request failed: {exc}",
            ) from exc
        finally:
            if owns_client:
                client.close()

        if response.status_code >= 400:
            raise CmaSearchError(
                "carrier_error",
                f"CMA live HTTP {response.status_code}",
            )
        try:
            payload = response.json()
        except ValueError as exc:
            raise CmaSearchError(
                "carrier_error",
                "CMA live response was not JSON",
            ) from exc
        if not isinstance(payload, dict):
            raise CmaSearchError(
                "carrier_error",
                "CMA live response root must be a JSON object",
            )
        return payload


def resolve_strategy(name: str | None = None) -> OfferStrategy:
    strategy = (name or os.environ.get("SPOT_CMA_STRATEGY") or "fixture").strip().lower()
    if strategy == "live":
        return LiveOfferStrategy()
    return FixtureOfferStrategy()

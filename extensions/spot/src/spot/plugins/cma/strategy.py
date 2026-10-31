from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Protocol

from spot.plugins.base import SearchRequest
from spot.plugins.cma.errors import CmaSearchError

_DEFAULT_FIXTURE = (
    Path(__file__).resolve().parents[4]
    / "tests"
    / "fixtures"
    / "cma"
    / "quotes_sample.json"
)


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
    """Placeholder for future official API live path."""

    def fetch(
        self,
        request: SearchRequest,
        credentials: dict[str, str],
    ) -> dict[str, Any]:
        _ = request, credentials
        raise CmaSearchError(
            "live_unavailable",
            "Live CMA strategy is not enabled in this build",
        )


def resolve_strategy(name: str | None = None) -> OfferStrategy:
    strategy = (name or os.environ.get("SPOT_CMA_STRATEGY") or "fixture").strip().lower()
    if strategy == "live":
        return LiveOfferStrategy()
    return FixtureOfferStrategy()

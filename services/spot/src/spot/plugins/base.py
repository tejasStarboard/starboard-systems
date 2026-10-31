from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class SearchRequest:
    organization_id: str
    origin: str | None
    destination: str | None
    mode: str = "fcl"


@dataclass(frozen=True)
class NormalizedRate:
    """Rate shape aligned with contracts create-rate (source always spot)."""

    origin: str | None
    destination: str | None
    carrier: str | None
    label: str
    currency_code: str
    amount: float
    valid_from: str
    valid_to: str
    source: str = "spot"
    mode: str = "fcl"

    def to_dict(self) -> dict[str, str | float | None]:
        return {
            "origin": self.origin,
            "destination": self.destination,
            "carrier": self.carrier,
            "label": self.label,
            "currencyCode": self.currency_code,
            "amount": self.amount,
            "validFrom": self.valid_from,
            "validTo": self.valid_to,
            "source": self.source,
            "mode": self.mode,
        }


class CredentialPort(Protocol):
    """Carrier credential lookup. Real stores land with carrier plugins."""

    def get(self, organization_id: str, carrier: str) -> dict[str, str] | None:
        ...


class NoopCredentialPort:
    def get(self, organization_id: str, carrier: str) -> dict[str, str] | None:
        return None


class SpotPlugin(Protocol):
    id: str

    def search(
        self,
        request: SearchRequest,
        credentials: dict[str, str] | None,
    ) -> list[NormalizedRate]:
        ...

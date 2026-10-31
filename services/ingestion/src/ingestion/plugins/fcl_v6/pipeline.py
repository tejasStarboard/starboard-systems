from __future__ import annotations

import csv
import io
from dataclasses import asdict, dataclass
from pathlib import Path


REQUIRED_COLUMNS = (
    "origin",
    "destination",
    "carrier",
    "label",
    "currency",
    "amount",
    "valid_from",
    "valid_to",
)


@dataclass(frozen=True)
class SheetPlan:
    format: str
    path: str
    row_count_estimate: int


@dataclass(frozen=True)
class ExtractedRate:
    origin: str | None
    destination: str | None
    carrier: str | None
    label: str
    currency_code: str
    amount: float | None
    valid_from: str
    valid_to: str
    mode: str = "fcl"


@dataclass(frozen=True)
class GateResult:
    ok: bool
    reason: str | None
    rates: list[ExtractedRate]


def plan_sheet(path: str) -> SheetPlan:
    """Detect a minimal ocean FCL CSV sheet (v6 vertical slice — not a legacy port)."""
    text = Path(path).read_text(encoding="utf-8")
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise ValueError("sheet has no header row")
    headers = {h.strip().lower() for h in reader.fieldnames}
    missing = [col for col in REQUIRED_COLUMNS if col not in headers]
    if missing:
        raise ValueError(f"unsupported sheet; missing columns: {', '.join(missing)}")
    rows = list(reader)
    return SheetPlan(format="fcl_v6_csv", path=path, row_count_estimate=len(rows))


def extract_rates(path: str) -> list[ExtractedRate]:
    text = Path(path).read_text(encoding="utf-8")
    reader = csv.DictReader(io.StringIO(text))
    assert reader.fieldnames is not None
    # Normalize keys
    rates: list[ExtractedRate] = []
    for raw in reader:
        row = {k.strip().lower(): (v.strip() if isinstance(v, str) else v) for k, v in raw.items()}
        amount_raw = row.get("amount") or ""
        amount: float | None
        try:
            amount = float(amount_raw) if amount_raw != "" else None
        except ValueError:
            amount = None
        rates.append(
            ExtractedRate(
                origin=_empty_to_none(row.get("origin")),
                destination=_empty_to_none(row.get("destination")),
                carrier=_empty_to_none(row.get("carrier")),
                label=row.get("label") or "",
                currency_code=(row.get("currency") or "").upper(),
                amount=amount,
                valid_from=row.get("valid_from") or "",
                valid_to=row.get("valid_to") or "",
            )
        )
    return rates


def gate_rates(rates: list[ExtractedRate]) -> GateResult:
    """Blocking gate: reject before any rates HTTP save on failure."""
    if not rates:
        return GateResult(ok=False, reason="no rates extracted", rates=[])

    for index, rate in enumerate(rates):
        if rate.origin == "GATE_FAIL":
            return GateResult(
                ok=False,
                reason=f"row {index}: explicit gate fail marker",
                rates=rates,
            )
        if not rate.origin or not rate.destination:
            return GateResult(
                ok=False,
                reason=f"row {index}: origin and destination are required",
                rates=rates,
            )
        if not rate.label:
            return GateResult(
                ok=False, reason=f"row {index}: label is required", rates=rates
            )
        if rate.amount is None or rate.amount < 0:
            return GateResult(
                ok=False,
                reason=f"row {index}: amount must be a non-negative number",
                rates=rates,
            )
        if len(rate.currency_code) != 3:
            return GateResult(
                ok=False,
                reason=f"row {index}: currency must be a 3-letter code",
                rates=rates,
            )
        if not rate.valid_from or not rate.valid_to:
            return GateResult(
                ok=False,
                reason=f"row {index}: valid_from and valid_to are required",
                rates=rates,
            )

    return GateResult(ok=True, reason=None, rates=rates)


def rate_to_create_payload(rate: ExtractedRate) -> dict:
    assert rate.amount is not None
    return {
        "origin": rate.origin,
        "destination": rate.destination,
        "customerId": None,
        "mode": rate.mode,
        "carrier": rate.carrier,
        "label": rate.label,
        "currencyCode": rate.currency_code,
        "amount": rate.amount,
        "validFrom": rate.valid_from,
        "validTo": rate.valid_to,
        "source": "ingestion",
    }


def gate_result_to_dict(result: GateResult) -> dict:
    return {
        "ok": result.ok,
        "reason": result.reason,
        "rates": [asdict(rate) for rate in result.rates],
    }


def _empty_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed if trimmed else None

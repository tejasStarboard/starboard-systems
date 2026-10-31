from __future__ import annotations

from typing import Any

from spot.plugins.base import NormalizedRate


def _parse_amount(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, dict):
        value = value.get("amount")
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_date(value: str | None) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    return text[:10] if text else None


def _loc_code(location: Any) -> str | None:
    if not isinstance(location, dict):
        return None
    for key in ("unlocode", "code", "name"):
        raw = location.get(key)
        if raw:
            return str(raw)
    return None


def normalize_quotes(
    response: dict[str, Any],
    *,
    origin: str | None,
    destination: str | None,
    mode: str = "fcl",
) -> list[NormalizedRate]:
    """Map CMA Instant Quoting API JSON into host NormalizedRate rows."""
    rates: list[NormalizedRate] = []

    for entry in response.get("quotes") or []:
        if not isinstance(entry, dict):
            continue

        price = entry.get("price") or {}
        if not isinstance(price, dict):
            continue
        amount = _parse_amount(price.get("amount"))
        if amount is None:
            continue

        equipment = entry.get("equipment") or {}
        equipment_label = ""
        if isinstance(equipment, dict):
            equipment_label = str(
                equipment.get("label") or equipment.get("iso") or ""
            ).strip()

        product_name = str(entry.get("productName") or "CMA CGM Spot")
        label = (
            f"{product_name} {equipment_label}".strip()
            if equipment_label
            else product_name
        )

        validity = entry.get("validity") if isinstance(entry.get("validity"), dict) else {}
        schedule = entry.get("schedule") if isinstance(entry.get("schedule"), dict) else {}

        valid_from = (
            _parse_date(validity.get("from") if validity else None)
            or _parse_date(schedule.get("etd") if schedule else None)
            or "1970-01-01"
        )
        valid_to = (
            _parse_date(validity.get("to") if validity else None)
            or _parse_date(schedule.get("eta") if schedule else None)
            or valid_from
        )

        origin_code = origin or _loc_code(entry.get("origin"))
        destination_code = destination or _loc_code(entry.get("destination"))

        rates.append(
            NormalizedRate(
                origin=str(origin_code) if origin_code else None,
                destination=str(destination_code) if destination_code else None,
                carrier="CMACGM",
                label=label,
                currency_code=str(price.get("currency") or "USD"),
                amount=amount,
                valid_from=valid_from,
                valid_to=valid_to,
                source="spot",
                mode=mode or "fcl",
            )
        )

    return rates

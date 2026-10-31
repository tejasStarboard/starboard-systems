from __future__ import annotations

from typing import Any

from spot.plugins.base import NormalizedRate


def _total_amount(price: dict[str, Any]) -> float | None:
    total = price.get("total")
    if isinstance(total, dict):
        total = total.get("amount")
    if total is None:
        return None
    try:
        return float(total)
    except (TypeError, ValueError):
        return None


def _parse_date(value: str | None) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    return text[:10] if text else None


def _offer_has_price(entry: dict[str, Any]) -> bool:
    if entry.get("offerFilteredReasons"):
        return False
    rsp = entry.get("routeScheduleWithPrices") or {}
    return _total_amount(rsp.get("price") or {}) is not None


def normalize_product_offers(
    response: dict[str, Any],
    *,
    origin: str | None,
    destination: str | None,
    mode: str = "fcl",
) -> list[NormalizedRate]:
    """Map Maersk productoffers JSON into host NormalizedRate rows."""
    rates: list[NormalizedRate] = []

    for entry in response.get("offers") or []:
        if not isinstance(entry, dict) or not _offer_has_price(entry):
            continue

        product = entry.get("productOffer") or {}
        rsp = entry.get("routeScheduleWithPrices") or {}
        price = rsp.get("price") or {}
        schedule = rsp.get("routeScheduleFull") or rsp.get("routeSchedule") or {}

        amount = _total_amount(price)
        if amount is None:
            continue

        origin_code = (
            origin
            or product.get("originRkstCode")
            or product.get("originDisplayName")
        )
        destination_code = (
            destination
            or product.get("destinationRkstCode")
            or product.get("destinationDisplayName")
        )

        from_loc = schedule.get("fromLocation") or {}
        to_loc = schedule.get("toLocation") or {}
        valid_from = (
            _parse_date(from_loc.get("date") if isinstance(from_loc, dict) else None)
            or _parse_date(schedule.get("departureDate"))
            or "1970-01-01"
        )
        valid_to = (
            _parse_date(to_loc.get("date") if isinstance(to_loc, dict) else None)
            or _parse_date(schedule.get("arrivalDate"))
            or valid_from
        )

        containers = product.get("containers") or []
        container_label = ""
        if containers and isinstance(containers[0], dict):
            container_label = str(
                containers[0].get("label") or containers[0].get("name") or ""
            ).strip()

        product_name = str(product.get("productName") or "Maersk Spot")
        label = (
            f"{product_name} {container_label}".strip()
            if container_label
            else product_name
        )

        rates.append(
            NormalizedRate(
                origin=str(origin_code) if origin_code else None,
                destination=str(destination_code) if destination_code else None,
                carrier="MAERSK",
                label=label,
                currency_code=str(price.get("totalPriceCurrency") or "USD"),
                amount=amount,
                valid_from=valid_from,
                valid_to=valid_to,
                source="spot",
                mode=mode or "fcl",
            )
        )

    return rates

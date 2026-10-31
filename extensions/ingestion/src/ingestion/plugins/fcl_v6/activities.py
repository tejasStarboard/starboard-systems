from __future__ import annotations

import os
from dataclasses import asdict
from typing import Any

from temporalio import activity

from starboard_python_kit import RatesHttpClient

from .pipeline import (
    ExtractedRate,
    extract_rates,
    gate_rates,
    gate_result_to_dict,
    plan_sheet,
    rate_to_create_payload,
)


@activity.defn(name="fcl_v6.plan")
async def plan_activity(path: str) -> dict[str, Any]:
    plan = plan_sheet(path)
    return asdict(plan)


@activity.defn(name="fcl_v6.extract")
async def extract_activity(path: str) -> list[dict[str, Any]]:
    return [asdict(rate) for rate in extract_rates(path)]


@activity.defn(name="fcl_v6.gate")
async def gate_activity(rates: list[dict[str, Any]]) -> dict[str, Any]:
    parsed = [
        ExtractedRate(
            origin=item.get("origin"),
            destination=item.get("destination"),
            carrier=item.get("carrier"),
            label=item.get("label") or "",
            currency_code=item.get("currency_code") or "",
            amount=item.get("amount"),
            valid_from=item.get("valid_from") or "",
            valid_to=item.get("valid_to") or "",
            mode=item.get("mode") or "fcl",
        )
        for item in rates
    ]
    return gate_result_to_dict(gate_rates(parsed))


@activity.defn(name="fcl_v6.save")
async def save_activity(
    organization_id: str, rates: list[dict[str, Any]]
) -> dict[str, Any]:
    client = RatesHttpClient(
        base_url=os.environ.get("RATES_SERVICE_URL", "http://127.0.0.1:3104"),
        service_token=os.environ["INTERNAL_SERVICE_TOKEN"],
    )
    created_ids: list[str] = []
    for item in rates:
        rate = ExtractedRate(
            origin=item.get("origin"),
            destination=item.get("destination"),
            carrier=item.get("carrier"),
            label=item.get("label") or "",
            currency_code=item.get("currency_code") or "",
            amount=item.get("amount"),
            valid_from=item.get("valid_from") or "",
            valid_to=item.get("valid_to") or "",
            mode=item.get("mode") or "fcl",
        )
        created = client.create_rate(organization_id, rate_to_create_payload(rate))
        created_ids.append(created["id"])
    return {"rateIds": created_ids}

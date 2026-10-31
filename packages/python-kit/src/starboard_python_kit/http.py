from __future__ import annotations

from typing import Any

import httpx


class ServiceHttpError(RuntimeError):
    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.status_code = status_code


class RatesHttpClient:
    """POST catalog rates into services/rates with service-token auth."""

    def __init__(
        self,
        *,
        base_url: str,
        service_token: str,
        timeout_s: float = 30.0,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._service_token = service_token
        self._timeout_s = timeout_s

    def create_rate(
        self, organization_id: str, payload: dict[str, Any]
    ) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self._service_token}",
            "X-Organization-Id": organization_id,
            "Content-Type": "application/json",
        }
        with httpx.Client(timeout=self._timeout_s) as client:
            response = client.post(
                f"{self._base_url}/rates",
                headers=headers,
                json=payload,
            )
        if response.status_code >= 400:
            detail = response.text
            try:
                body = response.json()
                if isinstance(body, dict):
                    detail = str(body.get("detail") or body.get("error") or detail)
            except Exception:  # noqa: BLE001 — keep raw text on parse failure
                pass
            raise ServiceHttpError(
                f"rates create failed ({response.status_code}): {detail}",
                response.status_code,
            )
        return response.json()

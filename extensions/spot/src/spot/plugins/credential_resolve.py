from __future__ import annotations

import os
from typing import Any

import httpx


def resolve_carrier_credentials(
    *,
    settings: dict[str, str] | None,
    env_credentials: dict[str, str] | None,
) -> dict[str, str] | None:
    """Prefer org settings. Env JSON remains the dev fallback."""
    if settings:
        cleaned = {
            str(key): str(value)
            for key, value in settings.items()
            if value is not None and str(value).strip()
        }
        if cleaned:
            return cleaned
    return env_credentials or None


def fetch_org_credentials(
    extension_id: str, organization_id: str
) -> dict[str, str] | None:
    """Ask the BFF for decrypted org credentials. Failures fall through to env."""
    base = os.environ.get("APP_URL", "").strip().rstrip("/")
    token = os.environ.get("INTERNAL_SERVICE_TOKEN", "").strip()
    if not base or not token or not extension_id or not organization_id:
        return None
    try:
        response = httpx.get(
            f"{base}/api/internal/carrier-credentials",
            params={
                "extensionId": extension_id,
                "organizationId": organization_id,
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=5.0,
        )
    except httpx.HTTPError:
        return None
    if response.status_code != 200:
        return None
    try:
        body: Any = response.json()
    except ValueError:
        return None
    if not isinstance(body, dict):
        return None
    credentials = body.get("credentials")
    if not isinstance(credentials, dict) or not credentials:
        return None
    cleaned = {
        str(key): str(value)
        for key, value in credentials.items()
        if value is not None and str(value).strip()
    }
    return cleaned or None

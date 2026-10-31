from __future__ import annotations

import base64
import hashlib
import secrets
from dataclasses import dataclass
from urllib.parse import urlencode

import httpx

GRAPH_SCOPES = "offline_access User.Read Mail.Read Mail.Send"


@dataclass(frozen=True)
class OAuthConfig:
    client_id: str
    client_secret: str
    tenant_id: str
    redirect_uri: str


def encode_oauth_state(organization_id: str, nonce: str | None = None) -> str:
    raw_nonce = nonce or secrets.token_urlsafe(16)
    payload = f"{organization_id}:{raw_nonce}".encode("utf-8")
    return base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")


def decode_oauth_state(state: str) -> str:
    padding = "=" * (-len(state) % 4)
    try:
        decoded = base64.urlsafe_b64decode(state + padding).decode("utf-8")
    except Exception as error:  # noqa: BLE001
        raise ValueError("invalid oauth state") from error
    organization_id, _, _nonce = decoded.partition(":")
    if not organization_id:
        raise ValueError("invalid oauth state")
    return organization_id


def build_authorize_url(config: OAuthConfig, *, organization_id: str) -> str:
    state = encode_oauth_state(organization_id)
    query = urlencode(
        {
            "client_id": config.client_id,
            "response_type": "code",
            "redirect_uri": config.redirect_uri,
            "response_mode": "query",
            "scope": GRAPH_SCOPES,
            "state": state,
        }
    )
    return (
        f"https://login.microsoftonline.com/{config.tenant_id}"
        f"/oauth2/v2.0/authorize?{query}"
    )


def _token_url(tenant_id: str) -> str:
    return (
        f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    )


def exchange_code_for_tokens(
    config: OAuthConfig,
    *,
    code: str,
    transport: httpx.BaseTransport | None = None,
) -> dict[str, str]:
    with httpx.Client(transport=transport, timeout=30.0) as client:
        response = client.post(
            _token_url(config.tenant_id),
            data={
                "client_id": config.client_id,
                "client_secret": config.client_secret,
                "code": code,
                "redirect_uri": config.redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        response.raise_for_status()
        payload = response.json()
    refresh = payload.get("refresh_token")
    access = payload.get("access_token")
    if not isinstance(refresh, str) or not refresh:
        raise ValueError("token response missing refresh_token")
    if not isinstance(access, str) or not access:
        raise ValueError("token response missing access_token")
    return {"refresh_token": refresh, "access_token": access}


def refresh_access_token(
    config: OAuthConfig,
    *,
    refresh_token: str,
    transport: httpx.BaseTransport | None = None,
) -> str:
    with httpx.Client(transport=transport, timeout=30.0) as client:
        response = client.post(
            _token_url(config.tenant_id),
            data={
                "client_id": config.client_id,
                "client_secret": config.client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
                "scope": GRAPH_SCOPES,
            },
        )
        response.raise_for_status()
        payload = response.json()
    access = payload.get("access_token")
    if not isinstance(access, str) or not access:
        raise ValueError("token response missing access_token")
    return access


def stub_callback_path(organization_id: str) -> str:
    """Relative shell path used in stub mode (no Azure redirect)."""
    digest = hashlib.sha256(organization_id.encode("utf-8")).hexdigest()[:8]
    return (
        f"/api/extensions/messaging.msgraph/connection/callback"
        f"?organizationId={organization_id}&code=stub&state={digest}"
    )

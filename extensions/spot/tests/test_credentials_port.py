from __future__ import annotations

import asyncio

import httpx
import pytest

from spot.plugins.credential_resolve import (
    fetch_org_credentials,
    resolve_carrier_credentials,
)
from spot.plugins.maersk.validate import validate_credentials as validate_maersk
from spot.plugins.cma.validate import validate_credentials as validate_cma


def test_settings_win_over_env() -> None:
    resolved = resolve_carrier_credentials(
        settings={"username": "from-settings", "password": "secret"},
        env_credentials={"username": "from-env", "password": "env-secret"},
    )
    assert resolved == {"username": "from-settings", "password": "secret"}


def test_env_fallback_when_settings_missing() -> None:
    resolved = resolve_carrier_credentials(
        settings=None,
        env_credentials={"apiKey": "key", "clientId": "client"},
    )
    assert resolved == {"apiKey": "key", "clientId": "client"}


def test_empty_settings_fall_through_to_env() -> None:
    resolved = resolve_carrier_credentials(
        settings={"username": "  "},
        env_credentials={"username": "from-env", "password": "env-secret"},
    )
    assert resolved == {"username": "from-env", "password": "env-secret"}


def test_fetch_org_credentials_reads_settings_payload(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("APP_URL", "http://web.test")
    monkeypatch.setenv("INTERNAL_SERVICE_TOKEN", "token-token-token")

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["extensionId"] == "spot.maersk"
        assert request.url.params["organizationId"] == "org_1"
        assert request.headers["authorization"] == "Bearer token-token-token"
        return httpx.Response(
            200,
            json={"credentials": {"username": "demo", "password": "secret"}},
        )

    monkeypatch.setattr(
        httpx,
        "get",
        lambda *args, **kwargs: httpx.Client(
            transport=httpx.MockTransport(handler)
        ).get(*args, **kwargs),
    )
    assert fetch_org_credentials("spot.maersk", "org_1") == {
        "username": "demo",
        "password": "secret",
    }


@pytest.mark.asyncio
async def test_validate_stubs_return_ok(monkeypatch: pytest.MonkeyPatch) -> None:
    async def no_sleep(_seconds: float) -> None:
        return None

    monkeypatch.setattr(asyncio, "sleep", no_sleep)
    assert await validate_maersk({"username": "a", "password": "b"}) == {"ok": True}
    assert await validate_cma({"apiKey": "k", "clientId": "c"}) == {"ok": True}

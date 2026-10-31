from __future__ import annotations

from contextlib import contextmanager
from typing import Any

from cryptography.fernet import Fernet

from messaging.plugins.msgraph.token_store import (
    ConnectionRecord,
    NeonTokenStore,
)


class _FakeCursor:
    def __init__(self, rows: dict[str, tuple[Any, ...]]) -> None:
        self._rows = rows
        self._last: tuple[Any, ...] | None = None
        self.executed: list[tuple[str, tuple[Any, ...] | None]] = []

    def execute(self, sql: str, params: tuple[Any, ...] | None = None) -> None:
        self.executed.append((sql, params))
        if params and "SELECT" in sql.upper():
            org = params[0]
            self._last = self._rows.get(str(org))
        elif params and "INSERT" in sql.upper():
            org = str(params[0])
            self._rows[org] = (params[1], params[2])
            self._last = None

    def fetchone(self) -> tuple[Any, ...] | None:
        return self._last

    def __enter__(self) -> _FakeCursor:
        return self

    def __exit__(self, *args: object) -> None:
        return None


class _FakeConn:
    def __init__(self, rows: dict[str, tuple[Any, ...]]) -> None:
        self.rows = rows
        self.cursor_obj = _FakeCursor(rows)

    def cursor(self) -> _FakeCursor:
        return self.cursor_obj

    def commit(self) -> None:
        return None

    def __enter__(self) -> _FakeConn:
        return self

    def __exit__(self, *args: object) -> None:
        return None


def test_neon_store_encrypts_refresh_and_hides_plaintext() -> None:
    key = Fernet.generate_key()
    rows: dict[str, tuple[Any, ...]] = {}
    store = NeonTokenStore(postgres_url="postgresql://unused", token_key=key)

    @contextmanager
    def fake_connect():
        yield _FakeConn(rows)

    store._connect = fake_connect  # type: ignore[method-assign]

    plaintext = "refresh:super-secret"
    encrypted = store.encrypt_token(plaintext)
    store.save(
        ConnectionRecord(
            organization_id="org_neon",
            status="connected",
            encrypted_refresh_token=encrypted,
        )
    )
    loaded = store.get("org_neon")
    assert loaded.status == "connected"
    assert loaded.encrypted_refresh_token == encrypted
    assert store.decrypt_token(encrypted) == plaintext
    assert store.plaintext_absent_from_row("org_neon") is True
    assert plaintext not in (rows["org_neon"][1] or "")

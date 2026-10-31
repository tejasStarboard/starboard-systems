from __future__ import annotations

import httpx

from messaging.plugins.msgraph.graph_client import (
    HttpGraphClient,
    SendMailRequest,
)


def test_http_graph_list_and_send_with_mock_transport() -> None:
    calls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(f"{request.method} {request.url.path}")
        assert request.headers.get("Authorization") == "Bearer access-token"
        if request.method == "GET" and request.url.path.endswith("/me/messages"):
            return httpx.Response(
                200,
                json={
                    "value": [
                        {
                            "id": "m1",
                            "subject": "Hello",
                            "bodyPreview": "Preview",
                            "from": {
                                "emailAddress": {"address": "a@example.com"}
                            },
                        }
                    ]
                },
            )
        if request.method == "POST" and request.url.path.endswith("/me/sendMail"):
            return httpx.Response(202)
        return httpx.Response(404)

    client = HttpGraphClient(transport=httpx.MockTransport(handler))
    messages = client.list_recent_messages(access_token="access-token", limit=5)
    assert len(messages) == 1
    assert messages[0].id == "m1"
    assert messages[0].from_address == "a@example.com"

    result = client.send_mail(
        access_token="access-token",
        request=SendMailRequest(
            to_address="b@example.com", subject="S", body="Body"
        ),
    )
    assert result.status == "sent"
    assert "GET /v1.0/me/messages" in calls
    assert "POST /v1.0/me/sendMail" in calls

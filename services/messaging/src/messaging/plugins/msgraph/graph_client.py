from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class GraphMessage:
    id: str
    subject: str
    from_address: str
    body_preview: str


@dataclass
class SendMailRequest:
    to_address: str
    subject: str
    body: str
    quote_id: str | None = None


@dataclass
class SendMailResult:
    id: str
    status: str


class GraphClient(Protocol):
    def list_recent_messages(
        self, *, access_token: str, limit: int = 10
    ) -> list[GraphMessage]: ...

    def send_mail(
        self, *, access_token: str, request: SendMailRequest
    ) -> SendMailResult: ...


class FakeGraphClient:
    """In-memory Graph stand-in for tests and local vertical slice."""

    def __init__(
        self,
        *,
        inbox: list[GraphMessage] | None = None,
        fail_send: bool = False,
    ) -> None:
        self.inbox = list(inbox or [])
        self.fail_send = fail_send
        self.sent: list[SendMailRequest] = []
        self._send_counter = 0

    def list_recent_messages(
        self, *, access_token: str, limit: int = 10
    ) -> list[GraphMessage]:
        if not access_token:
            raise ValueError("access_token required")
        return self.inbox[:limit]

    def send_mail(
        self, *, access_token: str, request: SendMailRequest
    ) -> SendMailResult:
        if not access_token:
            raise ValueError("access_token required")
        if self.fail_send:
            raise RuntimeError("graph send failed")
        self.sent.append(request)
        self._send_counter += 1
        return SendMailResult(
            id=f"sent_{self._send_counter}", status="sent"
        )


class HttpGraphClient:
    """Thin MS Graph HTTP client (production path; unused in unit tests)."""

    def __init__(self, *, base_url: str = "https://graph.microsoft.com/v1.0") -> None:
        self._base_url = base_url.rstrip("/")

    def list_recent_messages(
        self, *, access_token: str, limit: int = 10
    ) -> list[GraphMessage]:
        import httpx

        response = httpx.get(
            f"{self._base_url}/me/messages",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"$top": str(limit)},
            timeout=30.0,
        )
        response.raise_for_status()
        value = response.json().get("value") or []
        result: list[GraphMessage] = []
        for item in value:
            sender = (item.get("from") or {}).get("emailAddress") or {}
            result.append(
                GraphMessage(
                    id=str(item.get("id") or ""),
                    subject=str(item.get("subject") or ""),
                    from_address=str(sender.get("address") or ""),
                    body_preview=str(item.get("bodyPreview") or ""),
                )
            )
        return result

    def send_mail(
        self, *, access_token: str, request: SendMailRequest
    ) -> SendMailResult:
        import httpx

        payload = {
            "message": {
                "subject": request.subject,
                "body": {"contentType": "Text", "content": request.body},
                "toRecipients": [
                    {"emailAddress": {"address": request.to_address}}
                ],
            },
            "saveToSentItems": True,
        }
        response = httpx.post(
            f"{self._base_url}/me/sendMail",
            headers={"Authorization": f"Bearer {access_token}"},
            json=payload,
            timeout=30.0,
        )
        response.raise_for_status()
        return SendMailResult(id="graph_send", status="sent")

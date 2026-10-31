# Domain: messaging

|                 |                                            |
| --------------- | ------------------------------------------ |
| Service         | `extensions/messaging` (Python + Temporal) |
| First extension | `messaging.msgraph`                        |
| Status          | Vertical slice (ticket 030)                |

## Owns

Provider adapters, inbound message events, outbound send. Shell quotes remain
usable without it.

## Token storage

MS Graph refresh tokens are Fernet-encrypted (`MESSAGING_TOKEN_KEY`) and stored
per org under `MESSAGING_DATA_DIR`. Ciphertext only on disk. Production should
keep the same envelope and move rows to a Neon table owned by this service.

## Extension

`messaging.msgraph` — stub OAuth connect, Temporal sync job
(`messaging.msgraph.sync`), outbound send API, Settings **Connect Outlook** +
Inbox UI when enabled + enterprise plan.

## Tickets

[030](../../tickets/in_progress/030-ext-messaging-msgraph.md)

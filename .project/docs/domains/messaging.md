# Domain: messaging

|                 |                                            |
| --------------- | ------------------------------------------ |
| Service         | `extensions/messaging` (Python + Temporal) |
| First extension | `messaging.msgraph`                        |
| Status          | Production path (ticket 063)               |

## Owns

Provider adapters, inbound message events, outbound send. Shell quotes remain
usable without it.

## Token + message storage

MS Graph refresh tokens are Fernet-encrypted (`MESSAGING_TOKEN_KEY`) and stored
per org in Neon schema `messaging` (`messaging.connection`). Ciphertext only —
never plaintext refresh tokens. Synced message previews live in
`messaging.message`.

Local/unit tests may use the file-backed stores under `MESSAGING_DATA_DIR` when
`POSTGRES_URL` is unset. Runtime API/worker prefer Neon when `POSTGRES_URL` is
set.

## Graph modes

| Mode | When                                                             |
| ---- | ---------------------------------------------------------------- |
| Stub | `MS_GRAPH_CLIENT_ID` / `MS_GRAPH_CLIENT_SECRET` unset (CI/local) |
| Live | Both Azure app credentials set                                   |

Live mode uses Azure AD authorize + token exchange (`MS_GRAPH_TENANT_ID`,
`MS_GRAPH_REDIRECT_URI`) and `HttpGraphClient` against Microsoft Graph. Stub
keeps FakeGraphClient and a relative shell callback URL.

Redirect URI (shell): `/api/extensions/messaging.msgraph/connection/callback`.

## Sync cadence

Platform setting `sync_interval_minutes` (default 15) is forwarded on enqueue
(ticket 061). The messaging API upserts a Temporal **Schedule**
`messaging.msgraph.sync-{organizationId}` with that interval; disconnect deletes
it. One-shot `messaging.msgraph.sync` workflows still run on manual enqueue.

## Extension

`messaging.msgraph` — OAuth connect, Temporal sync job, outbound send API,
Settings **Connect Outlook** + Inbox UI when enabled + enterprise plan.
Inactive extension hides connect UI; extension APIs 404 via
`requireActiveExtension`.

## Tickets

[030](../../tickets/done/030-ext-messaging-msgraph.md) ·
[063](../../tickets/in_progress/063-messaging-production-path.md)

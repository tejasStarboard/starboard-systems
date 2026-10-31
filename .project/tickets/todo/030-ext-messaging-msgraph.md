---
id: 030
wave: 03-messaging
title: Extension messaging.msgraph
status: open
depends_on: [001, 002, 005]
epic: SYS-EXT-MSGRAPH
docs:
  - .project/docs/domains/messaging.md
  - .project/docs/extensions.md
  - .project/docs/adr/0002-python-temporal-extensions.md
---

# Extension messaging.msgraph

## Goal

First messaging provider: Microsoft Graph (Outlook). Connect mailbox (OAuth), receive inbound mail hook or poll job, expose send-reply capability for a quote. Shell works without the extension.

## Non-goals

- Gmail / Front / IMAP
- Full RFQ LLM extraction (can stub “create draft quote from email” or defer agents)
- Outlook add-in UI

## Files to touch

- `services/messaging` Python + `msgraph` plugin
- Extension manifest + BFF proxy
- Settings “Connect Outlook” when extension enabled
- Token storage pattern (encrypted; document)

## Acceptance criteria

- [ ] Org can connect MS Graph when extension enabled
- [ ] Inbound path records a message or job (minimal)
- [ ] Outbound send API exists (even if UI is minimal)
- [ ] Disabled extension hides connect UI

## Fixtures / tests

- Mock Graph client tests for send/connect state machine

## Out of scope

Add-in; Gmail; agents consensus extraction

---
id: 063
wave: 06-product
title: Messaging production path (Graph OAuth + Neon)
status: done
depends_on: [030, 055, 061]
epic: SYS-EXT-MSGRAPH
docs:
  - .project/docs/domains/messaging.md
  - .project/docs/extensions.md
---

# Messaging production path (Graph OAuth + Neon)

## Goal

Replace stub OAuth and file-backed token/message stores with real Microsoft Graph OAuth and Neon-backed persistence. Wire Connect Outlook in settings + sync interval from extension settings.

## Non-goals

- Gmail / Front / IMAP
- Full RFQ LLM extraction
- Outlook add-in host

## Acceptance criteria

- [x] Authorize + callback with Azure AD app config via env
- [x] Tokens encrypted at rest in Neon (not default-dev file store)
- [x] Messages list/send against Graph in non-stub mode
- [x] Extension inactive → connect UI hidden; APIs 404
- [x] Sync respects `sync_interval_minutes` when set

## Out of scope

Add-in; agents

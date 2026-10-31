---
id: 069
wave: 06-product
title: Org carrier credentials in settings (not env)
status: open
depends_on: [057, 058, 061]
epic: SYS-EXT-SPOT
docs:
  - .project/docs/extensions.md
  - .project/docs/domains/spot.md
  - .project/docs/adr/0005-extension-foundation.md
---

# Org carrier credentials in settings (not env)

## Goal

Replace the awkward `SPOT_MAERSK_CREDENTIALS` / `SPOT_CMA_CREDENTIALS` env JSON maps with **org-scoped extension settings** (secret fields), editable in the customer shell — same convenience model as starboard-2 carrier credentials in settings.

Store secrets **encrypted at rest** using a server-side encryption key (same pattern as Better Auth’s `BETTER_AUTH_SECRET`: e.g. `EXTENSION_SETTINGS_SECRET` / reuse a dedicated app secret — never the DB URL). Decrypt only in trusted server paths (BFF → worker credential port). After save, run a **per-carrier `validate` job** so the UI confirms credentials before relying on them; stub the validate body for now.

Spot workers resolve credentials from stored settings for the active `organizationId` (env remains optional local/dev fallback only).

## Non-goals

- Live Maersk/CMA HTTP strategies (062) — real validate implementations land with or after 062
- Platform-admin-only secret entry as the long-term UX (staff may still view/edit for support, but tenants must self-serve)
- External KMS / Vault (app-secret AES encrypt is enough for v1)
- More carriers than Maersk + CMA in this ticket

## Acceptance criteria

### Storage + encryption

- [ ] `spot.maersk` and `spot.cma` declare `contributes.settings` secret fields for the credential keys the plugins already expect (e.g. username/password/customerCode — match current ports)
- [ ] `scope: "organization"` is supported for extension settings storage + APIs (unique per org + extension + key); platform-scoped settings unchanged
- [ ] Secret values are **encrypted before write** (authenticated encryption, e.g. AES-GCM) with a dedicated env secret analogous to `BETTER_AUTH_SECRET`; ciphertext only in Postgres; plaintext never persisted
- [ ] GET/list responses never return decrypted secrets — only `configured: true | false` (and optional `validatedAt` / last validation status)
- [ ] Decrypt only when issuing credentials to the spot worker / validate path; secrets never logged

### Validate after save

- [ ] After credentials are saved (or explicitly “Validate”), BFF enqueues/calls a **carrier-specific `validate` method** with the decrypted creds
- [ ] Each carrier plugin owns custom validation logic later (e.g. rates-search probe for API scrapers; login/session check for web scrapers). **This ticket stubs** `validate` as: sleep ~5s → return `{ ok: true }` (no network)
- [ ] UI shows a clear **Validating…** loading state for that carrier while the async validate is in flight; disable save/re-validate until settled
- [ ] On stub success, surface validated state (e.g. “Credentials validated”); on failure (when real validate exists later), show error without echoing secret values
- [ ] Missing settings → clear `missing_credentials` for search (same as today); env JSON is documented as **dev fallback only**
- [ ] Domain / extensions docs updated (encryption secret, validate stub → real probes in 062)

## Files to touch

- `extensions/host` — organization scope on settings schema + helpers
- `packages/database` — `platform.extension_setting` (or sibling) org column / uniqueness; store ciphertext only for secrets
- Shared encrypt/decrypt helper (web BFF and/or service-kit) keyed by env secret
- `apps/web` — org settings UI + BFF routes (non-admin); validating loading state; optional validation status fields
- `extensions/spot` — Maersk/CMA credential ports read decrypted settings; **stub `validate` per plugin** (5s → true)
- `.project/docs/extensions.md`, `.project/docs/domains/spot.md`

## Fixtures / tests

- Unit: encrypt → store shape → decrypt round-trip; GET never leaks plaintext
- Unit: org-scoped get/set + redaction
- UI/BFF: save triggers validate; response waits ~5s stub; UI loading flag covered if practical
- Spot: credential port returns settings-backed dict when present; env fallback still works in test

## Out of scope

062 live strategies + real carrier validate probes; messaging OAuth (063); CRM settings shell completeness (064)

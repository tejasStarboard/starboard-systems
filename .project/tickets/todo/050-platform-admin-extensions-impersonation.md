---
id: 050
wave: 05-platform-admin
title: Platform admin — extension rollout + org impersonation
status: open
depends_on: [001, 005]
epic: SYS-PLATFORM-ADMIN
docs:
  - .project/docs/domains/platform-admin.md
  - .project/docs/extensions.md
  - .project/docs/adr/0003-extension-host.md
---

# Platform admin — extension rollout + org impersonation

## Goal

Ship a **Starboard staff-only** `/admin` surface (not customer org-admin) so the
dev / ops team can:

1. Enable or disable extensions globally or as **beta** for selected customer
   orgs (no client-facing extensions marketplace).
2. **Switch into** a customer organization (impersonate) to view/use their
   shell data for support, then exit back to staff context.

Move extension registry controls off the customer Integrations page; customers
only see connection UX for extensions already active for them.

## Non-goals

- Full admin node-graph UI (deferred)
- Customer self-serve “search & install extensions”
- Plan override / audit log UI / support notes (listed in domain doc — later
  tickets)
- Better Auth org role `admin` changes (orthogonal)

## Files to touch

- Staff allowlist / platform role (env or DB) + gate helpers
- `apps/web/app/(admin)/…` (or equivalent) — extensions rollout + org search /
  switcher
- Extension-host or BFF rollout store: global flag + optional org allowlist
  per extension id; activation = rollout ∩ enabled ∩ entitled
- Impersonation session: staff user acts with target `organizationId`; audit
  fields
- Customer `/settings/integrations`: remove registry enable/list-as-marketplace
  behavior; keep Connect Outlook (etc.) only when already active
- Hide `/admin` from non-staff nav entirely

## Acceptance criteria

- [ ] Non-staff users cannot open `/admin/*` (404) and see no admin nav
- [ ] Staff can set an extension to off / beta (org allowlist) / on for all
      entitled orgs; shell contributions respect that rollout
- [ ] Staff can search organizations and switch into one; shell data then
      scopes to that org; staff can exit impersonation
- [ ] Impersonation and rollout changes record actor (staff user id) for audit
      (persist at least enough for later audit UI)
- [ ] Customer Integrations page is not an extensions marketplace / enable UI

## Fixtures / tests

- Staff vs non-staff gate tests
- Rollout matrix: disabled / beta org / entitled vs not
- Impersonation sets active org for subsequent BFF calls; exit clears it

## Out of scope

Node-graph; plan override UI; public extension store; Gmail/Outlook add-in admin

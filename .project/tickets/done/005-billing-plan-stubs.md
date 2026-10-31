---
id: 005
wave: 00-shell
title: Billing plan stubs (credit + enterprise)
status: done
depends_on: [001]
epic: SYS-BILLING
docs:
  - .project/docs/architecture.md
  - .project/docs/extensions.md
---

# Billing plan stubs (credit + enterprise)

## Goal

Model two plans — `credit` and `enterprise` — on the org (or org metadata), expose an entitlement helper used by extension-host, and show plan on a settings stub. No Stripe checkout required yet.

## Non-goals

- Stripe checkout / portal / webhooks
- Credit ledger / usage metering
- Enforcing paid limits in production

## Files to touch

- Better Auth org additional fields or `billing` table owned by shell
- `extensions/host` entitlement integration
- Settings UI stub for current plan
- `.project/docs` note if plan storage location is decided

## Acceptance criteria

- [x] Org has a plan of `credit` | `enterprise` (default documented)
- [x] Extension host filters manifests by `requiredPlan`
- [x] Settings page shows current plan
- [x] No payment provider required for local dev

## Fixtures / tests

- Entitlement unit tests for both plans

## Out of scope

Real SB Lite credits; Stripe

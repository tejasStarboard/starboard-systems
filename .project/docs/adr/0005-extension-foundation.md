# ADR 0005 — Extension foundation before more product extensions

## Status

Accepted

## Context

Tickets 001–050 delivered a working but thin extension host: manifests, plan ∩ enabled ∩ rollout, per-extension Next routes, Temporal workers. Disabling an extension usually 404s/redirects, but:

- App layout always loads rollouts from DB with no fail-safe (DB errors take down the shell).
- Each extension adds a **hand-written** `app/api/extensions/<id>/…` route and hard-coded client paths.
- Async UX stops at workflow ids — no shared job status/result contract.
- Building “contract rates”, live spot, etc. without a frozen integration pattern will fork N one-off shapes.

## Decision

**Prioritize hardening the extension foundation** before new product capability tickets (apply rates, live carriers, CRM fields, etc.).

Canonical extension slice:

```
manifest (host registry)
  → contributes: nav | uiSlots | api | jobs
  → BFF: activation gate + generic /api/extensions/[extensionId]/[...path]
  → domain manager/client derived from manifest.worker
  → Temporal workflow (202 + ids) + queryable status/result
  → UI mounts only via active contributions (no hard-coded feature ifs in shell core)
```

Activation remains: **rollout ∩ manifest.enabled ∩ requiredPlan**.

Shell must remain usable with **all** extensions inactive.

## Non-goals (this foundation wave)

- Live Maersk/CMA strategies
- Excel/PDF ingestion parity
- Real Graph OAuth productionization (can follow once job/API patterns exist)
- Stripe credits

## Consequences

- Ticket `055` (and follow-ups `056+` if split) block feature tickets that depend on extension UX.
- Docs (`extensions.md`, skill `starboard-extension`) become the cookbook for new extensions.
- Roadmap wave **05-foundation** comes before quote-rate-apply / CRM expansion.

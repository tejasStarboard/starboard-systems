# Build priority — 2026-11-01

Derived from [starboard-2 features](starboard-2-features-2026-11-01.md) and [rewrite coverage](rewrite-coverage-2026-11-01.md).

**Principle:** finish the **quote money path** on the web shell using the extension platform we already built. Defer surfaces (Outlook/Gmail), ERP, marketplace, and ML until quoting is honest.

---

## P0 — Quote is usable end-to-end (do now)

| Order | Ticket / work                                                                                         | Why                                                         |
| ----: | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
|     1 | **[060](../../tickets/todo/060-apply-rate-to-quote-lane.md)** Apply catalog/spot → lane               | Without this, rates/spot/ingest don’t enter the quote       |
|     2 | **[065](../../tickets/todo/065-surcharge-data-model.md)** Surcharge model + contracts                 | Prod QGS is charge-line driven; flat amounts are not enough |
|     3 | **[066](../../tickets/todo/066-surcharge-pricing-engine.md)** Units + % freight in `packages/pricing` | Makes ONE MATH real for surcharges                          |
|     4 | **[067](../../tickets/todo/067-surcharge-quote-ui.md)** Surcharges in quote UI / apply path           | User-visible origin/freight/destination + line units        |

Parallel with P0 (small, unblocks live spot):

| Order | Ticket                                                                             | Why                                            |
| ----: | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
|     ‖ | **[061](../../tickets/todo/061-extension-settings-runtime.md)** Settings → workers | Admin toggles already exist; wire them through |

---

## P1 — Make extensions production-shaped

| Order | Ticket                                                                                                    | Why                                                               |
| ----: | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
|     5 | **[068](../../tickets/todo/068-global-charges-incoterm-scope.md)** Globals + bucket/incoterm scope        | Completes surcharge story for door-to-door / Incoterms            |
|     6 | **[069](../../tickets/todo/069-org-carrier-credentials-settings.md)** Org carrier credentials in settings | Replace env JSON; tenants set Maersk/CMA secrets like starboard-2 |
|     7 | **[062](../../tickets/todo/062-live-spot-strategies.md)** Live Maersk → CMA                               | Real buy rates into 060 (after 061 + 069)                         |
|     8 | **[063](../../tickets/todo/063-messaging-production-path.md)** Graph OAuth + Neon                         | Email-native loop; can parallel 062                               |

---

## P2 — Shell completeness

| Order | Ticket                                                                                           | Why                                              |
| ----: | ------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
|     9 | **[064](../../tickets/todo/064-crm-and-settings-shell.md)** CRM fields/contacts + settings pages | Needed for real tenants; not blocking money math |
|    10 | Quote stages / validity / PDF export                                                             | Ticket TBD after 067                             |
|    11 | FCL v6 beyond CSV (Excel/PDF agent)                                                              | Ticket TBD; keep as `ingestion.fcl_v6` extension |

---

## P3 — Later (explicitly not next)

- More spot carriers (Hapag, MSC, …) as plugins
- Air / LCL / cartage / drayage ingest extensions
- Outlook / Gmail / Front / Companion
- Public API, Stripe Lite credits, analytics/KPI
- RFR automation, chat agents, freight index
- FFW OS, marketplace, auto-margin, rate-choice

---

## Sequencing diagram

```text
060 apply rate ─────────┐
061 settings runtime ───┤
069 org carrier creds ──┼──► 062 live spot
065 → 066 → 067 surcharges ──► 068 globals/incoterm
063 messaging (parallel)
064 CRM/settings (whenever)
```

**Do not start** Outlook or new ingest modes until **060 + 065–067** land.

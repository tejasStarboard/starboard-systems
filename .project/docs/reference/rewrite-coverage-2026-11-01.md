# starboard-systems rewrite coverage tracker

**Date:** 2026-11-01  
**Against:** [starboard-2-features-2026-11-01.md](starboard-2-features-2026-11-01.md)  
**Roadmap:** [../roadmap.md](../roadmap.md)

Legend: **Done** · **Partial** · **Ticketed** · **Not started** · **Out of scope / deferred** · **Won’t port**

---

## Summary

| Area                                                               | Status                         |
| ------------------------------------------------------------------ | ------------------------------ |
| Shell (auth, org, quotes CRUD, geo facilities, rates catalog stub) | Done / Partial                 |
| Extension platform (host, Temporal jobs, admin rollout + settings) | Done                           |
| Quote loop (apply rates, surcharges, PDF/send)                     | Ticketed / Not started         |
| Live spot / real messaging / rich CRM                              | Ticketed / Partial stubs       |
| Outlook/Gmail/Companion/Public API/OS/ML marketplace               | Not started / Deferred / Won’t |

**Waves 0–5 done** (tickets 001–058). **Wave 6 open:** 060–068. Priority order: [build-priority-2026-11-01.md](build-priority-2026-11-01.md).

---

## 1. Surfaces

| Prod feature           | Rewrite          | Notes                                         |
| ---------------------- | ---------------- | --------------------------------------------- |
| Webapp                 | **Partial**      | Next shell + BFF; settings pages mostly stubs |
| Outlook add-in         | **Not started**  | Deferred; share quote-editor later            |
| Gmail extension        | **Not started**  | Deferred                                      |
| Front plugin           | **Not started**  | Deferred                                      |
| Companion              | **Not started**  | Deferred                                      |
| Public API             | **Not started**  | Deferred                                      |
| Client portal / OS UI  | **Out of scope** | ERP deferred                                  |
| Hapag free-time worker | **Not started**  | Optional later with spot                      |

---

## 2. Quoting

| Prod feature                      | Rewrite              | Notes                                                                        |
| --------------------------------- | -------------------- | ---------------------------------------------------------------------------- |
| RFQ v2 email → quote              | **Partial**          | Messaging stub only; no full extract pipeline                                |
| QGS multi-lane editor             | **Partial**          | Lanes/cargo/manual rates persist (002)                                       |
| ONE MATH                          | **Partial**          | `packages/pricing`: manual totals + inclusion/usage helpers; not full engine |
| Markups / tiers / FX              | **Partial**          | Lane markup only                                                             |
| Surcharges (legs, units, globals) | **Not started**      | Inclusion predicate exists unused; no charge rows                            |
| Quote stages / lifecycle          | **Not started**      |                                                                              |
| PDF / Excel / templates           | **Not started**      |                                                                              |
| Send reply                        | **Partial**          | Messaging send stub (030)                                                    |
| RFR / recurring RFR               | **Not started**      |                                                                              |
| Autonomous modes                  | **Not started**      |                                                                              |
| Agentic extraction                | **Not started**      |                                                                              |
| CargoWise sync                    | **Not started**      |                                                                              |
| Ocean booking                     | **Won’t / deferred** | Dev-only in prod                                                             |
| Sailing schedules                 | **Not started**      |                                                                              |
| Apply catalog/spot → lane         | **Ticketed**         | [060](../../tickets/todo/060-apply-rate-to-quote-lane.md)                    |

---

## 3. Rate catalog & ingestion

| Prod feature                         | Rewrite              | Notes                                                    |
| ------------------------------------ | -------------------- | -------------------------------------------------------- |
| Rates catalog CRUD                   | **Partial**          | `services/rates` (020); flat amount rows                 |
| FCL v6 ingest                        | **Partial**          | CSV + Temporal vertical slice (021); not Excel/PDF agent |
| FCL v3–v5                            | **Won’t port**       | Deprecations                                             |
| Air / LCL / cartage / drayage ingest | **Not started**      | Separate extensions later                                |
| Amendments workflows                 | **Not started**      |                                                          |
| Rate marketplace                     | **Won’t / deferred** | Dev-only in prod                                         |

---

## 4. Spot / carriers

| Prod feature                       | Rewrite         | Notes                                                           |
| ---------------------------------- | --------------- | --------------------------------------------------------------- |
| Spot host + job status             | **Partial**     | 040 + 055 foundation                                            |
| Fake / Maersk / CMA plugins        | **Partial**     | Fixture only (041/042)                                          |
| Live strategies                    | **Ticketed**    | [062](../../tickets/todo/062-live-spot-strategies.md) after 061 |
| Settings → live_strategy           | **Ticketed**    | [061](../../tickets/todo/061-extension-settings-runtime.md)     |
| Full scraper fleet (Hapag, MSC, …) | **Not started** | Per-carrier extensions later                                    |
| Companion                          | **Not started** | Deferred                                                        |
| Precache / warm pools              | **Not started** |                                                                 |

---

## 5. Geography

| Prod feature                                     | Rewrite         | Notes                   |
| ------------------------------------------------ | --------------- | ----------------------- |
| Facility gazetteer                               | **Done**        | ADR 0004 / ticket 007   |
| Port search API                                  | **Done**        | Via `/ports`            |
| Door addresses (Places)                          | **Partial**     | Google Places endpoints |
| ES dual SoT                                      | **Won’t port**  | Postgres SoT            |
| Route planner / transit cache / learned mappings | **Not started** |                         |

---

## 6. Email / messaging

| Prod feature                       | Rewrite         | Notes                                                      |
| ---------------------------------- | --------------- | ---------------------------------------------------------- |
| Extension host + MS Graph stub     | **Partial**     | 030                                                        |
| Real Graph OAuth + Neon store      | **Ticketed**    | [063](../../tickets/todo/063-messaging-production-path.md) |
| Gmail / IMAP / Front / EmailEngine | **Not started** | Later extensions                                           |
| Classifiers / RFR headless         | **Not started** |                                                            |

---

## 7. Agents / LLM

| Prod feature               | Rewrite              | Notes            |
| -------------------------- | -------------------- | ---------------- |
| Add-in chat agents         | **Not started**      | After surfaces   |
| FCL v6 coding agent parity | **Not started**      | Beyond CSV slice |
| RFQ agent extraction       | **Not started**      |                  |
| Memory system              | **Won’t / deferred** | Off in prod      |

---

## 8. ML

| Prod feature              | Rewrite          | Notes            |
| ------------------------- | ---------------- | ---------------- |
| Auto-margin / rate-choice | **Out of scope** | Dev-only in prod |
| Freight index             | **Not started**  | Optional later   |
| Email classifier          | **Not started**  |                  |

---

## 9. CRM

| Prod feature                   | Rewrite         | Notes                                                   |
| ------------------------------ | --------------- | ------------------------------------------------------- |
| Org-scoped customers           | **Partial**     | Name-only (004)                                         |
| Contacts + richer fields       | **Ticketed**    | [064](../../tickets/todo/064-crm-and-settings-shell.md) |
| ES / VendorIQ / sourcing rules | **Not started** |                                                         |

---

## 10. Billing

| Prod feature                  | Rewrite         | Notes                                    |
| ----------------------------- | --------------- | ---------------------------------------- |
| Plan stubs credit/enterprise  | **Partial**     | 005; entitlements for extensions         |
| Stripe / Lite seats / credits | **Not started** | Deferred                                 |
| Self-serve signup             | **Partial**     | Better Auth register; not Lite packaging |

---

## 11. Auth / admin

| Prod feature                            | Rewrite         | Notes                                           |
| --------------------------------------- | --------------- | ----------------------------------------------- |
| Better Auth + organizations             | **Done**        | Replaces Supabase auth model                    |
| Platform admin + impersonation          | **Done**        | 050                                             |
| Extension rollout + settings UI         | **Done**        | 057/058                                         |
| System feature-flag matrix (prod-style) | **Partial**     | Plan + rollout + settings; not full flag groups |
| Public API keys                         | **Not started** | With public API                                 |

---

## 12. Analytics

| Prod feature            | Rewrite         | Notes |
| ----------------------- | --------------- | ----- |
| Quoting dashboard / KPI | **Not started** |       |
| Superset / Metabase     | **Deferred**    |       |

---

## 13. FFW OS

| Prod feature                     | Rewrite          | Notes               |
| -------------------------------- | ---------------- | ------------------- |
| Shipments / AR/AP / ISF / Vizion | **Out of scope** | Explicitly deferred |

---

## 14. Extension platform (rewrite-native)

| Capability                           | Status       | Tickets |
| ------------------------------------ | ------------ | ------- |
| Manifest registry + entitlements     | **Done**     | 001     |
| Temporal workers + 202 jobs + status | **Done**     | 055     |
| Generic BFF `/api/extensions/[id]/…` | **Done**     | 055     |
| Admin settings declarations          | **Done**     | 057/058 |
| Developer cookbook                   | **Done**     | 056     |
| Settings runtime in workers          | **Ticketed** | 061     |

---

## 15. Open ticket queue (execute next)

See [build-priority-2026-11-01.md](build-priority-2026-11-01.md).

| ID  | Title                                | Band            |
| --- | ------------------------------------ | --------------- |
| 060 | Apply catalog/spot rate → quote lane | **P0**          |
| 061 | Extension settings runtime           | **P0** parallel |
| 065 | Surcharge data model + contracts     | **P0**          |
| 066 | Surcharge amount engine              | **P0**          |
| 067 | Surcharges in quote UI               | **P0**          |
| 068 | Globals + incoterm scope             | **P1**          |
| 062 | Live spot Maersk/CMA                 | **P1**          |
| 063 | Messaging Graph OAuth + Neon         | **P1**          |
| 064 | CRM + settings shell                 | **P2**          |

---

## How to update this doc

1. When a ticket merges: flip the matching row to **Done** / **Partial** and link the ticket under `done/`.
2. On each major audit of `starboard-2`, refresh the dated features doc and bump this tracker’s date (or add a dated changelog entry below).

### Changelog

- **2026-11-01** — Initial coverage tracker vs starboard-2 inventory; Wave 6 tickets 060–064 noted; surcharge gap called out.

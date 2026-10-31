# starboard-2 production feature reference

**Date:** 2026-11-01  
**Source repo:** `../starboard-2` (inventory against `origin/main` / working tree; flag values live in DB)  
**Companion tracker:** [rewrite-coverage-2026-11-01.md](rewrite-coverage-2026-11-01.md)

Status tags: **[PROD]** shipped on main · **[FLAG]** gated · **[BETA]** per-company beta · **[DEV-ONLY]** on/near `dev` not general main · **[LEGACY]** superseded but present · **[OFF]** disabled/retired

---

## 1. Surfaces

| Feature | Status | Notes |
|---------|--------|-------|
| Webapp (Next pages + BFF) | PROD | Quotes, rates, CRM, analytics, settings, admin |
| Outlook add-in | PROD | Primary day-to-day quoting surface |
| Gmail Chrome extension | PROD | Reuses add-in UI via alias |
| Front plugin | FLAG | In outlook-addin; Front ingest flag |
| Companion (Tauri + Python engine) | FLAG | Local-browser spot; UI largely removed from main (SB-7192) |
| Public API (Go Fiber v2/v3) | PROD | API keys per company |
| Client portal / order-dash pages | LEGACY | Product-gated legacy |
| Hapag free-time worker | PROD | Azure DI → Redis grants |

---

## 2. Quoting (RFQ → quote → reply)

| Feature | Status | Notes |
|---------|--------|-------|
| RFQ v2 email extract → resolve → quote | PROD | Geo consensus, CRM match, route plan, sender gates |
| QGS / multi-lane multi-leg editor | PROD | Ocean / air / drayage / cartage / LCL legs |
| ONE MATH pricing engine | PROD | Python SoT; TS twins + fixture oracles |
| Markups, tiers, FX, min profit | PROD | |
| Surcharges (leg buckets, units, globals, inclusion) | PROD | origin/freight/destination/globals; usage units; % freight |
| Quote stages / lifecycle | PROD | Stage dashboard bits partly DEV-ONLY |
| PDF / Excel / template quote output | PROD / FLAG | Excel, WWL, OL templates flagged |
| Send reply / drafts via mail | PROD | |
| RFR send + vendor finder | PROD | |
| Recurring RFR jobs | PROD | |
| Auto-RFR follow-up | FLAG | |
| Autonomous modes (source / save / spot / RFQ) | FLAG | Guardrails UI |
| Agentic RFQ extraction | BETA | Per-company; Gemini tool loop |
| CargoWise quote sync | FLAG | |
| Ocean FCL booking | DEV-ONLY / FLAG | Adapters mostly not on main |
| Sailing schedules | PROD | SeaRates + caches |

---

## 3. Rate catalog & ingestion

| Feature | Status | Notes |
|---------|--------|-------|
| FCL v6 agent ingest | BETA | Coding agent + audit + geo; company flag |
| FCL v5 agent ingest | FLAG | Plan → review → commit + chat |
| FCL v3 / v4 | LEGACY | Still in tree / routes |
| Legacy PDF/Excel upload wizard | LEGACY | |
| Air v2 ingest | BETA | Weight breaks / ULD |
| Cartage v2 / drayage v2 / LCL | PROD | |
| Amendments / delete / restore | PROD | Foundry workflows |
| Carrier name variants | PROD | |
| Rate Management UI split | DEV-ONLY | |
| Rate marketplace (buy/sell) | DEV-ONLY | Lite buyer-only when present |

---

## 4. Spot / carriers

| Feature | Status | Notes |
|---------|--------|-------|
| Spot search UI + cache | FLAG | Parallel carriers |
| Scrapers: Hapag, Maersk, MSC, ONE, OOCL, Evergreen | PROD | Foundry / Camoufox / pools |
| APIs: CMA, ECU, Odyssey, Vanguard, HLS, CargoAI | PROD | |
| Companion local route | FLAG | |
| Credentials / OTP / proxies / warm schedules | PROD / FLAG | |
| ZIM / HMM scrapers | OFF | Retired |

---

## 5. Geography

| Feature | Status | Notes |
|---------|--------|-------|
| `geo_ports` gazetteer (UN/LOCODE, IATA) | PROD | |
| Elasticsearch geo search | PROD | Official identity in geo_v4 |
| Nearby / vicinity / port clusters | PROD | |
| OSM city polygons / postal | PROD | |
| Google address consensus | PROD | |
| Ocean route planner / connectivity | PROD | |
| Transit-time cache / overrides | PROD | |
| Geo learned mappings / review | PROD | Does not mutate geo_ports |
| Air gateway affinity | PROD | |

---

## 6. Email / messaging

| Feature | Status | Notes |
|---------|--------|-------|
| Email pipeline v2 (Graph, Gmail, IMAP/POP3, Front) | FLAG | EmailEngine for IMAP/POP3 |
| Legacy email pipeline v1 | LEGACY | |
| Email / RFR classifiers | PROD | |
| Front OAuth + webhooks + directory | FLAG | |

---

## 7. Agents / LLM

| Feature | Status | Notes |
|---------|--------|-------|
| Add-in chat agents (RFQ/RFR/rate) | PROD | Drafts, carrier find, issues |
| OpenAI / Gemini / Anthropic / Azure DI / LlamaParse | PROD | |
| Tenant memory system | OFF | Flag off |
| Doc / image parse endpoints | PROD | |

---

## 8. ML

| Feature | Status | Notes |
|---------|--------|-------|
| Auto-margin (XGBoost + experiments) | DEV-ONLY | Docs: not prod |
| Rate-choice “Recommended” badge | DEV-ONLY | |
| Freight index | PROD | Separate DB |
| Email classifier | PROD | |

---

## 9. CRM

| Feature | Status | Notes |
|---------|--------|-------|
| Companies / contacts / ES search | PROD | |
| New CRM UI | FLAG | |
| Contact-level sourcing rules | FLAG | |
| VendorIQ sync | PROD | |
| Customer memory for RFQ | PROD | |

---

## 10. Billing / Lite

| Feature | Status | Notes |
|---------|--------|-------|
| Stripe onboarding / trial / portal | PROD | |
| Starboard Lite (seats + credits) | FLAG | |
| Plan tier / admin overrides | PROD | |
| Self-serve signup | DEV-ONLY | |

---

## 11. Auth / tenancy / admin

| Feature | Status | Notes |
|---------|--------|-------|
| Supabase auth + company tenancy | PROD | Roles admin / pbr / sales |
| Starboard Admin hub | PROD | Companies, flags, keys, close account |
| System + per-company feature flags | PROD | |
| Public API key management | PROD | |
| Usage events / wait telemetry | PROD | |

---

## 12. Analytics

| Feature | Status | Notes |
|---------|--------|-------|
| Quoting dashboard / KPI v3 | PROD | |
| Add-in Performance tab | LEGACY | Hidden |
| Superset / Metabase | Unverified | Infra present |

---

## 13. FFW OS (ERP-like)

| Feature | Status | Notes |
|---------|--------|-------|
| Shipments / Control Tower / Data Review | LEGACY | Hardcoded few company IDs |
| Receivables / Payables | LEGACY | |
| Doc parse / generation | LEGACY | |
| Vizion tracking | LEGACY | |
| ISF / e-manifest (Crimson) | LEGACY | |

---

## 14. Integrations (selected)

CargoWise/Switchboard, Vizion, Crimson, Front, Stripe, Slack, Sentry, Google Maps/Geocode, api2pdf / HTML-to-image, Freightos (partial), TradeTech FTP, OTel.

---

## 15. Infra / ops

| Feature | Status | Notes |
|---------|--------|-------|
| Cloud Run `api` role | PROD | ~90 routers + loops |
| Cloud Run `foundry` (DBOS) | PROD | Scrapers, amendments, quotations — **not Temporal** |
| Job scheduler (RFR, harvest) | PROD | |
| Pulumi / Supabase / ES / Redis | PROD | |
| CI drift drills / canaries | PROD | |

---

## Explicitly not “current” product (do not treat as must-port)

- FCL v3 / v4 / most of v5 (superseded by v6 direction)
- Rate marketplace (dev-only)
- Auto-margin / rate-choice (dev-only)
- Memory system (off)
- FFW OS for general SaaS
- ZIM / HMM scrapers

Update this file when re-auditing `starboard-2`; bump the date in the filename or add a changelog section at the bottom.

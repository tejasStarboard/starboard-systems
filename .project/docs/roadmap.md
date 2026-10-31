# Roadmap

Lexical order under [../tickets/todo/](../tickets/todo/) is execution order **within a priority band**. See **[build priority 2026-11-01](reference/build-priority-2026-11-01.md)** for the ordered queue.

**Reference:** [starboard-2 features](reference/starboard-2-features-2026-11-01.md) · [rewrite coverage](reference/rewrite-coverage-2026-11-01.md)

## Wave 0–5 — Complete

Shell, geo, rates stub, pricing helpers, thin extensions, platform admin, extension foundation (055–058). See [tickets/done/](../tickets/done/).

## Wave 6 — Product loop (CURRENT)

### P0 — Quote money path

| Ticket                                                   | Title                                   | Status |
| -------------------------------------------------------- | --------------------------------------- | ------ |
| [060](../tickets/todo/060-apply-rate-to-quote-lane.md)   | Apply catalog/spot rate → quote lane    | open   |
| [061](../tickets/todo/061-extension-settings-runtime.md) | Extension settings → workers (parallel) | open   |
| [065](../tickets/todo/065-surcharge-data-model.md)       | Surcharge data model + contracts        | open   |
| [066](../tickets/todo/066-surcharge-pricing-engine.md)   | Surcharge amount engine                 | open   |
| [067](../tickets/todo/067-surcharge-quote-ui.md)         | Surcharges in quote UI                  | open   |

### P1 — Extensions production-shaped

| Ticket                                                      | Title                           | Status |
| ----------------------------------------------------------- | ------------------------------- | ------ |
| [068](../tickets/todo/068-global-charges-incoterm-scope.md) | Globals + incoterm/bucket scope | open   |
| [062](../tickets/todo/062-live-spot-strategies.md)          | Live spot Maersk/CMA            | open   |
| [063](../tickets/todo/063-messaging-production-path.md)     | Messaging Graph OAuth + Neon    | open   |

### P2 — Shell completeness

| Ticket                                               | Title                                | Status |
| ---------------------------------------------------- | ------------------------------------ | ------ |
| [064](../tickets/todo/064-crm-and-settings-shell.md) | CRM fields/contacts + settings pages | open   |

## Later (no tickets)

Excel/PDF ingest · more carriers · Outlook/Gmail/Companion · Public API · Stripe Lite · analytics · RFR/agents · FFW OS · marketplace / ML

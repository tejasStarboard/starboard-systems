---
id: 056
wave: 05-foundation
title: Extension developer workflow docs + skill sync
status: open
depends_on: [055]
epic: SYS-EXT-HOST
docs:
  - .project/docs/extensions.md
  - .project/docs/adr/0005-extension-foundation.md
  - .agents/skills/starboard-extension/SKILL.md
---

# Extension developer workflow docs + skill sync

## Goal

After 055 lands, freeze the **playbook** so feature chats can build extensions (e.g. contract-rate search, new `spot.*`) without reinventing BFF/Temporal/UI wiring.

## Non-goals

- Code changes beyond doc/skill fixes discovered while writing
- Implementing a new product extension in this ticket

## Deliverables

- [ ] `.project/docs/extensions.md`: step-by-step “add extension X” (manifest fields, worker layout, Temporal workflow naming, BFF dispatch, uiSlot/nav, rollout, unplug checklist, test matrix)
- [ ] Example walkthrough using `spot.fake` as the reference extension
- [ ] Sync `.agents/skills/starboard-extension` + `reference/checklist.md`
- [ ] Roadmap note: product tickets (apply rates, live spot, …) **depend on 055/056**

## Acceptance criteria

- [ ] A new agent chat can follow the cookbook and list exact files to touch for a new `spot.*` plugin without reading starboard-2
- [ ] Unplug checklist verified against current code paths post-055

## Out of scope

Implementing live carriers

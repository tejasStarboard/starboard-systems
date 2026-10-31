---
name: plan-ticket
description: Fetch a todo ticket by id and plan its implementation
---

Fetch ticket `$ARGUMENTS` in `.project/tickets/todo/` and plan implementation.

1. Resolve `$ARGUMENTS` as the ticket id (`tid`). If empty, ask for the id before continuing.
2. Open **only** the matching file under `.project/tickets/todo/` (filename starts with `{tid}-`). If missing from `todo/`, check `in_progress/` once; if still missing, stop and say so.
3. Read that ticket and only the `docs:` paths listed in its frontmatter. Do not dump the whole `.project` tree.
4. Follow skill `starboard-dev-workflow` through **select + sync origin/dev + reconcile done + plan** only. Do **not** create a branch, implement, commit, or open a PR unless the user asks after the plan.
5. Plan against current `origin/dev`: acceptance criteria only, files to touch, tests to add/update, and which one domain skill applies (`starboard-bun-service` | `starboard-extension` | `starboard-shell-bff` | auth).
6. Present a short implementation plan and wait for approval before coding.

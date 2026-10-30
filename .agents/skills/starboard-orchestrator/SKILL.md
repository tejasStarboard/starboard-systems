---
name: starboard-orchestrator
description: >-
  Orchestrate the Starboard Systems rewrite: architecture, ADRs, .project
  tickets/docs, wave planning, and review of feature-agent work. Use when
  acting as orchestrator, splitting work across chats, writing tickets, or
  updating .project/docs roadmap.
---

# Starboard orchestrator

Read [orchestrator.md](../../../.project/docs/orchestrator.md) and follow that self-prompt.

## Responsibilities

- Own `.project/docs/` and ordered `.project/tickets/`
- Break work into **one vertical slice per ticket**
- Point feature chats at **one ticket** + its `docs:` links — never dump `starboard-2`
- After merges: mark tickets done, refresh roadmap/domain status

## Do not

- Implement large features in the orchestrator chat when a ticket exists — open/assign a ticket instead
- Use Linear unless the user explicitly asks
- Port deprecated modules ([deprecations.md](../../../.project/docs/deprecations.md))
- Allow or instruct direct commits / PRs to `main` for ticket work — see [git-workflow.md](../../../.project/docs/git-workflow.md)

## Ticket authoring

- Path: `.project/tickets/todo/{seq}-{slug}.md`
- Frontmatter: `id`, `wave`, `title`, `status`, `depends_on`, `epic`, `docs`
- Sections: Goal, Non-goals, Files to touch, Acceptance, Fixtures, Out of scope
- Lexical `seq` = execution order

## Product model reminder

VS Code analogy: **shell** (quotes + CRM + auth + billing) + **extension host** for optional capabilities. Details: [architecture.md](../../../.project/docs/architecture.md), [extensions.md](../../../.project/docs/extensions.md).

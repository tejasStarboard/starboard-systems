---
id: 107
wave: 13-workbench-panel
title: Contribution invoke RPC (child BFF handlers + context args)
status: backlog
depends_on: []
epic: SYS-WORKBENCH
docs:
  - .project/docs/extension-points.md
  - .project/docs/extensions.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/adr/0003-extension-host.md
  - .project/docs/git-workflow.md
---

# Contribution invoke RPC (child BFF handlers + context args)

Formalize how a **host** contribution point triggers work on a **child** extension without a peer extension bus.

## Goal

1. Child extensions can declare an **invoke** contract (method/path under their existing `contributes.api` / BFF surface) alongside UI contributions.
2. Host chrome (commands, toolbars, headless hooks) passes **explicit context args** (`quoteId`, lane, …) and calls the **child’s** BFF via session-scoped `/api/extensions/<childId>/…`.
3. Child handler **re-validates** organization access to those resources; returns a result DTO for the host to apply (form callback / UI), when needed.

Complements in-tree **slot props** (interactive UI) — does not replace them. See [extension-points.md §5](../../docs/extension-points.md#5-context-for-child-contributions--ui-props-vs-invoke-rpc).

## Non-goals

- Peer-to-peer extension messaging or shared in-process RPC bus inside `@starboard/ext-host`
- Moving live form / charge-grid edits onto HTTP invoke
- Letting child extensions become a second writer of the quote aggregate by default
- Implementing Workspace State (**103**) or panel features (**104–106**)

## Design sketch

```text
Host command / slot action
  → shell invokeExtension({ extensionId, path, body: args })
  → BFF gate (entitlement + org session)
  → child handler
  → { ok, result } → host applies if required
```

Manifest (exact shape at implement time): e.g. contribution `invoke: { path: "export", … }` or parallel `contributes.invoke[]` keyed by id; must stay under that extension’s API prefix.

## Acceptance

- [ ] Documented + schema’d way for a contribution to declare an invoke target on the child BFF
- [ ] Shell/BFF helper invokes only **active/entitled** extensions; unplug → invoke fails closed
- [ ] At least one end-to-end example (prefer aligning with an existing command such as PDF export or spot job enqueue)
- [ ] Child handler tests prove forged/cross-org `quoteId` is rejected
- [ ] Docs: extension-points §5 + extensions cookbook remain accurate

## Related

- **102** — commands/keybindings may call invoke for server-side actions
- **073** / slot props — keep for interactive UI
- **103** — Workspace State for panel chrome (not invoke)

## Out of scope

- Rewriting all slot callbacks to HTTP

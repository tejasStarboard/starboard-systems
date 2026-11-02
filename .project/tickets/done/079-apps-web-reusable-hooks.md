---
id: 079
wave: 06-platform
title: Reusable React hooks under apps/web/hooks
status: done
depends_on: [074]
epic: SYS-SHELL
docs:
  - .project/docs/architecture.md
---

# Reusable React hooks under apps/web/hooks

## Goal

Extract repeated client logic from `apps/web` React components into focused hooks under `apps/web/hooks/`, then wire components to use them so UI files stay declarative.

## Inventory (from components audit)

| Hook                    | Replaces clunky patterns in                             |
| ----------------------- | ------------------------------------------------------- |
| `useAuth`               | login/register/forgot/reset/google sign-in/out; session |
| `useOrganizations`      | select-org list/enter/create; invitation load/accept    |
| `useImpersonation`      | org-search start; impersonation-banner exit             |
| `useAdminOrganizations` | org-search panel search                                 |
| `useExtensionJob`       | rates-upload enqueue+poll; shared 202 job plumbing      |
| `useMessagingInbox`     | inbox sync + send + message list refresh                |

## Acceptance

- [x] Hooks live under `apps/web/hooks/` (barrel `index.ts` optional)
- [x] Listed components use hooks instead of inline `authClient`/`fetch`+toast boilerplate
- [x] Behavior unchanged (toasts, redirects, pending flags)
- [x] Unit tests for non-trivial hooks (`useOrganizations`, `useImpersonation`, `useExtensionJob`)
- [x] `pnpm run ci` green

## Non-goals

- Moving builtin package (`extensions/builtins/*`) hooks into apps/web (those packages stay self-contained)
- Redesigning auth UX or workbench
- QV2 / Phase B tickets

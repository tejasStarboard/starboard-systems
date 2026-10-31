# Domain: platform admin (Starboard staff)

|         |                                              |
| ------- | -------------------------------------------- |
| Surface | `apps/web` route group `/admin` (staff only) |
| Status  | Not started                                  |

**Not** Better Auth organization role `admin` (customer org admins). This is
**Starboard employee / platform ops** access.

## Purpose

Internal console for the Starboard team to operate the product across all
customer organizations: roll out extensions, debug tenant data, and support
customers without shipping a client-facing “extensions marketplace.”

## Who can access

- Explicit **staff** allowlist (or equivalent platform role), never
  `organization.role === "admin"`.
- Unlisted users hitting `/admin/*` get **404** (do not advertise the surface).
- All staff actions are **audited** (who, what, which org, when).

## Capabilities (product definition)

### In scope for first ticket (050)

| Capability        | Description                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Staff gate        | Only allowlisted users see `/admin` nav and routes                                                                                   |
| Extension rollout | Enable / disable extensions globally; optional **beta** allowlist of org ids                                                         |
| Org switcher      | Staff picks a customer org and **acts as** that org for shell reads/writes (impersonation session), then exits back to staff context |
| Org directory     | Search/list organizations to support switcher                                                                                        |

### Planned later (separate tickets)

| Capability       | Notes                                                          |
| ---------------- | -------------------------------------------------------------- |
| Plan override    | Set org `plan` (`credit` / `enterprise`) for support / trials  |
| Extension health | Worker health / last job status (reads extension `healthPath`) |
| Audit log UI     | Browse staff impersonation + rollout changes                   |
| Support notes    | Attach internal notes to an org                                |
| Read-only mode   | Impersonate without mutating (optional hard mode)              |
| Admin node-graph | Visual extension registry (see ADR 0003) — deferred            |
| Invite staff     | Manage the staff allowlist itself                              |

## Client vs staff

| Surface                  | Audience       | Behavior                                                                                                                      |
| ------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/settings/integrations` | Customer users | Connection UX only (e.g. Connect Outlook) when extension already active for their org — **no** search/install/enable registry |
| `/admin/extensions`      | Staff          | Registry + global/beta rollout controls                                                                                       |
| `/admin/organizations`   | Staff          | Search orgs + switch into customer context                                                                                    |

## Entitlements vs rollout

- **Plan entitlements** (`requiredPlan` + org plan) stay in extension-host.
- **Rollout** (global off / beta orgs / all entitled orgs) is a staff-controlled
  layer **on top of** `enabled` + entitlements. Shell activation =
  `staffRollout && manifest.enabled && entitled(plan)`.

## Security notes

- Impersonation must bind `X-Organization-Id` / active org to the **target**
  customer org and record `actorUserId` (staff) separately.
- Never expose staff tools in customer settings or marketing nav.
- Prefer short-lived impersonation cookies/sessions with explicit “Exit
  customer”.

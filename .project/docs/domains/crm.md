# Domain: crm

| | |
|--|--|
| Service | `services/crm` (planned) |
| Schema | `crm.*` (planned) |
| Auth | Better Auth **organization** = tenant; CRM rows scoped by `organizationId` |
| Status | Not started — web currently misuses other orgs as customers |

## Owns

Customers, contacts, vendors for the active org.

## Does not own

Membership, roles, invitations (Better Auth organization plugin).

## Next tickets

[004](../../tickets/todo/004-crm-under-org.md)

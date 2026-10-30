# Domain: crm

|         |                                                                            |
| ------- | -------------------------------------------------------------------------- |
| Service | `services/crm`                                                             |
| Schema  | `crm.*`                                                                    |
| Auth    | Better Auth **organization** = tenant; CRM rows scoped by `organizationId` |
| Status  | Customers list/create live; contacts/vendors planned                       |

## Owns

Customers (and later contacts, vendors) for the active org.

## Does not own

Membership, roles, invitations (Better Auth organization plugin).

## API (service token + `X-Organization-Id`)

- `GET /customers` — list options for active org
- `POST /customers` — create customer (`{ name }`)
- `GET /customers/names?ids=` — resolve names (org-scoped)

Default port: `3103` (`CRM_SERVICE_URL`).

## Tickets

[004](../../tickets/in_progress/004-crm-under-org.md)

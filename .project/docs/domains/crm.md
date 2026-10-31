# Domain: crm

|         |                                                                            |
| ------- | -------------------------------------------------------------------------- |
| Service | `services/crm`                                                             |
| Schema  | `crm.*`                                                                    |
| Auth    | Better Auth **organization** = tenant; CRM rows scoped by `organizationId` |
| Status  | Customers + contacts live (lean fields); settings UI under shell           |

## Owns

Customers and contacts for the active org (address/email/phone, customer/vendor flags).

## Does not own

Membership, roles, invitations (Better Auth organization plugin). Company/team/profile settings live in the shell.

## API (service token + `X-Organization-Id`)

- `GET /customers` — list options `{ value, label }` for quote picker (label = name)
- `GET /customers?detail=1` — list full customer records
- `POST /customers` — create (`name` required; email/phone/address/isCustomer/isVendor optional)
- `GET /customers/:id` / `PATCH /customers/:id` — get/update expanded fields
- `GET /customers/names?ids=` — resolve names (org-scoped)
- `GET|POST /customers/:id/contacts` — list/create contacts
- `PATCH|DELETE /customers/:id/contacts/:contactId` — update/delete contact

Default port: `3103` (`CRM_SERVICE_URL`).

## Tickets

[004](../../tickets/done/004-crm-under-org.md) · [064](../../tickets/in_progress/064-crm-and-settings-shell.md)

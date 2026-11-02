/**
 * Manifest for driving built-in `crm.parties` (ticket 078).
 *
 * Plain data (no imports) so the host registry can bundle it and the
 * `@starboard/ext-host` Zod schema validates it at load. Default-on for
 * credit + enterprise; missing rollout row = on.
 *
 * - `customers` activity + `crm.parties.list` view; the entry opens the
 *   `customer.list` editor (owns the `/customers` deep link).
 * - `customer` editor owns `/customers/:resourceId`.
 * - `widgets.CustomerCombobox` is consumed by quote's customer field.
 */
export const manifest = {
  id: "crm.parties",
  version: "0.1.0",
  displayName: "CRM parties",
  requiredPlan: ["credit", "enterprise"],
  contributes: {
    activity: [{ id: "customers", label: "Customers", icon: "address-book" }],
    views: [
      {
        id: "crm.parties.list",
        name: "Customers",
        activityId: "customers",
        entries: [
          {
            id: "crm.parties.all",
            label: "All customers",
            opens: {
              viewType: "customer.list",
              resourceId: "/customers",
              title: "Customers",
            },
          },
        ],
      },
    ],
    editors: [
      {
        viewType: "customer",
        displayName: "Customer",
        deepLink: "/customers/:resourceId",
      },
      {
        viewType: "customer.list",
        displayName: "Customers",
        deepLink: "/customers",
      },
    ],
  },
  enabled: true,
} as const

export type BuiltinManifest = typeof manifest

import { index, pgSchema, text, timestamp } from "drizzle-orm/pg-core"

/** CRM service owns this Postgres schema. Auth org ids are opaque (no cross-schema FKs). */
export const crmSchema = pgSchema("crm")

export const customer = crmSchema.table(
  "customer",
  {
    id: text("id").primaryKey(),
    /** Opaque tenant organization id from auth (BFF-supplied). */
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("customer_organization_id_idx").on(table.organizationId),
    index("customer_organization_name_idx").on(
      table.organizationId,
      table.name
    ),
  ]
)

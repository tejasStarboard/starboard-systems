import { boolean, index, pgSchema, text, timestamp } from "drizzle-orm/pg-core"

/** CRM service owns this Postgres schema. Auth org ids are opaque (no cross-schema FKs). */
export const crmSchema = pgSchema("crm")

export const customer = crmSchema.table(
  "customer",
  {
    id: text("id").primaryKey(),
    /** Opaque tenant organization id from auth (BFF-supplied). */
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    isCustomer: boolean("is_customer").notNull().default(true),
    isVendor: boolean("is_vendor").notNull().default(false),
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

export const contact = crmSchema.table(
  "contact",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    role: text("role"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("contact_organization_id_idx").on(table.organizationId),
    index("contact_customer_id_idx").on(table.customerId),
    index("contact_organization_customer_idx").on(
      table.organizationId,
      table.customerId
    ),
  ]
)

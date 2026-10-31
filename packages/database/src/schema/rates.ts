import {
  doublePrecision,
  index,
  pgSchema,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

export type RateMode = "fcl" | "lcl" | "air"
export type RateSource = "manual" | "ingestion" | "spot"

/** Rates service owns this Postgres schema. Soft IDs only (no cross-schema FKs). */
export const ratesSchema = pgSchema("rates")

export const rateCatalog = ratesSchema.table(
  "rate",
  {
    id: text("id").primaryKey(),
    /** Opaque tenant organization id from auth (BFF-supplied). */
    organizationId: text("organization_id").notNull(),
    /** Soft port UN/LOCODE from geography. */
    origin: varchar("origin", { length: 7 }),
    /** Soft port UN/LOCODE from geography. */
    destination: varchar("destination", { length: 7 }),
    /** Soft CRM customer id. */
    customerId: text("customer_id"),
    mode: varchar("mode", { length: 10 })
      .$type<RateMode>()
      .notNull()
      .default("fcl"),
    carrier: text("carrier"),
    label: text("label").notNull().default(""),
    /** Soft currency code from geography. */
    currencyCode: varchar("currency_code", { length: 3 }).notNull(),
    amount: doublePrecision("amount").notNull(),
    validFrom: timestamp("valid_from").notNull(),
    validTo: timestamp("valid_to").notNull(),
    source: text("source").$type<RateSource>().notNull().default("manual"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("rate_organization_id_idx").on(table.organizationId),
    index("rate_organization_lane_idx").on(
      table.organizationId,
      table.origin,
      table.destination
    ),
    index("rate_organization_customer_idx").on(
      table.organizationId,
      table.customerId
    ),
    index("rate_organization_carrier_idx").on(
      table.organizationId,
      table.carrier
    ),
    index("rate_valid_range_idx").on(table.validFrom, table.validTo),
  ]
)

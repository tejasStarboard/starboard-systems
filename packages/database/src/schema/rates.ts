import type {
  ScopeOverride,
  SurchargeLeg,
  SurchargeSource,
  UsageUnit,
} from "@starboard/lib-contracts"
import { relations } from "drizzle-orm"
import {
  boolean,
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

/** Catalog charge lines — schema prep only (DAO/API wiring later). */
export const rateCatalogSurcharge = ratesSchema.table(
  "surcharge",
  {
    id: text("id").primaryKey(),
    rateId: text("rate_id")
      .notNull()
      .references(() => rateCatalog.id, { onDelete: "cascade" }),
    name: text("name").notNull().default(""),
    leg: varchar("leg", { length: 16 }).$type<SurchargeLeg>().notNull(),
    usageUnit: varchar("usage_unit", { length: 16 })
      .$type<UsageUnit>()
      .notNull()
      .default("flat"),
    rate: doublePrecision("rate"),
    ratePercentage: doublePrecision("rate_percentage"),
    currencyCode: varchar("currency_code", { length: 3 }).notNull(),
    source: varchar("source", { length: 16 })
      .$type<SurchargeSource>()
      .notNull()
      .default("manual"),
    isIncludedInTotal: boolean("is_included_in_total").notNull().default(true),
    isRemoved: boolean("is_removed").notNull().default(false),
    isVisible: boolean("is_visible").notNull().default(true),
    freeUsage: doublePrecision("free_usage"),
    minUsage: doublePrecision("min_usage"),
    maxUsage: doublePrecision("max_usage"),
    buyAmount: doublePrecision("buy_amount"),
    sellAmount: doublePrecision("sell_amount"),
    scopeOverride: varchar("scope_override", {
      length: 16,
    }).$type<ScopeOverride | null>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("rates_surcharge_rate_id_idx").on(table.rateId)]
)

export const rateCatalogRelations = relations(rateCatalog, ({ many }) => ({
  surcharges: many(rateCatalogSurcharge),
}))

export const rateCatalogSurchargeRelations = relations(
  rateCatalogSurcharge,
  ({ one }) => ({
    rate: one(rateCatalog, {
      fields: [rateCatalogSurcharge.rateId],
      references: [rateCatalog.id],
    }),
  })
)

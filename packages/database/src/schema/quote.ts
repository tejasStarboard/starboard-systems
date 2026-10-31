import type {
  Cargo,
  DoorAddress,
  LegMode,
  QuoteSource,
  QuoteStatus,
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
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

export type LaneMarkupType = "amount" | "percent"

/** Quotes service owns this Postgres schema. Auth/geo IDs are opaque (no cross-schema FKs). */
export const quotesSchema = pgSchema("quotes")

export type Dimensions = {
  length: number
  width: number
  height: number
}

export type { Cargo, LegMode, QuoteSource, QuoteStatus }
export type LaneMode = "fcl" | "lcl" | "air"

export const mode = quotesSchema.table("mode", {
  mode: varchar("mode", { length: 10 }).primaryKey(),
  label: text("label").notNull(),
})

export const containerType = quotesSchema.table("container_type", {
  type: varchar("type", { length: 10 }).primaryKey(),
  label: text("label").notNull(),
  dimensions: jsonb("dimensions").$type<Dimensions>().notNull(),
})

export const palletType = quotesSchema.table("pallet_type", {
  type: varchar("type", { length: 10 }).primaryKey(),
  label: text("label").notNull(),
  dimensions: jsonb("dimensions").$type<Dimensions>().notNull(),
})

export const quote = quotesSchema.table(
  "quote",
  {
    id: text("id").primaryKey(),
    source: text("source").$type<QuoteSource>().notNull().default("manual"),
    status: text("status").$type<QuoteStatus>().notNull().default("draft"),
    /** Opaque user id from auth (BFF-supplied). */
    ownerId: text("owner_id").notNull(),
    /** Opaque tenant organization id from auth (BFF-supplied). */
    organizationId: text("organization_id").notNull(),
    quoteId: varchar("quote_id", { length: 6 }).notNull(),
    /** Opaque CRM customer id (BFF-supplied; no cross-schema FK). */
    customerId: text("customer_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    effectiveFrom: timestamp("effective_from"),
    expiryAt: timestamp("expiry_at"),
    /** Opaque currency code from geography service. */
    currencyCode: varchar("currency_code", { length: 3 }),
  },
  (table) => [
    uniqueIndex("quote_organization_quote_id_uidx").on(
      table.organizationId,
      table.quoteId
    ),
    index("quote_organization_id_idx").on(table.organizationId),
    index("quote_organization_created_idx").on(
      table.organizationId,
      table.createdAt
    ),
    index("quote_customer_id_idx").on(table.customerId),
    index("quote_owner_id_idx").on(table.ownerId),
  ]
)

export const lane = quotesSchema.table(
  "lane",
  {
    id: text("id").primaryKey(),
    mode: varchar("mode", { length: 10 })
      .$type<LaneMode>()
      .notNull()
      .default("fcl"),
    /** Door pickup snapshot from Google Places (not a gazetteer FK). */
    pickupAddress: jsonb("pickup_address").$type<DoorAddress | null>(),
    /** Opaque port unlocode from geography. */
    origin: varchar("origin", { length: 7 }),
    originVia: varchar("origin_via", { length: 7 }),
    destinationVia: varchar("destination_via", { length: 7 }),
    destination: varchar("destination", { length: 7 }),
    /** Door delivery snapshot from Google Places (not a gazetteer FK). */
    deliveryAddress: jsonb("delivery_address").$type<DoorAddress | null>(),
    legOrder: jsonb("leg_order").$type<LegMode[]>().notNull().default([]),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quote.id, { onDelete: "cascade" }),
    cargo: jsonb("cargo").$type<Cargo[]>().notNull().default([]),
    markupType: varchar("markup_type", { length: 10 })
      .$type<LaneMarkupType>()
      .notNull()
      .default("amount"),
    markupValue: doublePrecision("markup_value").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("lane_quote_id_idx").on(table.quoteId),
    index("lane_origin_idx").on(table.origin),
    index("lane_destination_idx").on(table.destination),
  ]
)

export const rate = quotesSchema.table(
  "rate",
  {
    id: text("id").primaryKey(),
    laneId: text("lane_id")
      .notNull()
      .references(() => lane.id, { onDelete: "cascade" }),
    /** Opaque currency code from geography. */
    currencyCode: varchar("currency_code", { length: 3 }).notNull(),
    label: text("label").notNull().default(""),
    rate: doublePrecision("rate").notNull(),
    validFrom: timestamp("valid_from").notNull(),
    validTo: timestamp("valid_to").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("quote_rate_lane_id_idx").on(table.laneId),
    index("quote_rate_valid_range_idx").on(table.validFrom, table.validTo),
  ]
)

/** Lean charge line under a quote rate (prod qv2_surcharge subset). */
export const surcharge = quotesSchema.table(
  "surcharge",
  {
    id: text("id").primaryKey(),
    rateId: text("rate_id")
      .notNull()
      .references(() => rate.id, { onDelete: "cascade" }),
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
  (table) => [index("quote_surcharge_rate_id_idx").on(table.rateId)]
)

export const quoteRelations = relations(quote, ({ many }) => ({
  lanes: many(lane),
}))

export const laneRelations = relations(lane, ({ one, many }) => ({
  quote: one(quote, {
    fields: [lane.quoteId],
    references: [quote.id],
  }),
  rates: many(rate),
}))

export const rateRelations = relations(rate, ({ one, many }) => ({
  lane: one(lane, {
    fields: [rate.laneId],
    references: [lane.id],
  }),
  surcharges: many(surcharge),
}))

export const surchargeRelations = relations(surcharge, ({ one }) => ({
  rate: one(rate, {
    fields: [surcharge.rateId],
    references: [rate.id],
  }),
}))

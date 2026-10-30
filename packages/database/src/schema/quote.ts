import type {
  Cargo,
  LegMode,
  QuoteSource,
  QuoteStatus,
} from "@starboard/contracts"
import { relations } from "drizzle-orm"
import {
  doublePrecision,
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
  ]
)

export const lane = quotesSchema.table("lane", {
  id: text("id").primaryKey(),
  mode: varchar("mode", { length: 10 })
    .$type<LaneMode>()
    .notNull()
    .default("fcl"),
  /** Opaque location id from geography. */
  pickupId: text("pickup_id"),
  /** Opaque port unlocode from geography. */
  origin: varchar("origin", { length: 7 }),
  originVia: varchar("origin_via", { length: 7 }),
  destinationVia: varchar("destination_via", { length: 7 }),
  destination: varchar("destination", { length: 7 }),
  deliveryId: text("delivery_id"),
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
})

export const rate = quotesSchema.table("rate", {
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
})

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

export const rateRelations = relations(rate, ({ one }) => ({
  lane: one(lane, {
    fields: [rate.laneId],
    references: [lane.id],
  }),
}))

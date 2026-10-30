import { relations } from "drizzle-orm"
import {
  doublePrecision,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"
import { z } from "zod"

import { organization, user } from "./auth"
import { currency, location, port } from "./geography"

export type Dimensions = {
  length: number
  width: number
  height: number
}

export type LegMode = "ocean" | "air" | "drayage"

export const quoteSourceValues = ["email", "manual"] as const
export type QuoteSource = (typeof quoteSourceValues)[number]

export const quoteStatusValues = [
  "draft",
  "review",
  "sent",
  "win",
  "loss",
  "expired",
] as const
export type QuoteStatus = (typeof quoteStatusValues)[number]

export const cargoSchema = z.discriminatedUnion("mode", [
  z.object({
    id: z.string(),
    description: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    weight: z.number(),
    mode: z.literal("fcl"),
    containerCount: z.number().int(),
    containerType: z.string(),
  }),
  z.object({
    id: z.string(),
    description: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    weight: z.number(),
    mode: z.literal("lcl"),
    volume: z.number(),
    palletCount: z.number().int(),
    palletType: z.string(),
    hazmat: z.boolean(),
    fragile: z.boolean(),
  }),
  z.object({
    id: z.string(),
    description: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    weight: z.number(),
    mode: z.literal("air"),
    volume: z.number(),
    palletCount: z.number().int(),
    palletType: z.string(),
    hazmat: z.boolean(),
    fragile: z.boolean(),
  }),
])

export type Cargo = z.infer<typeof cargoSchema>

export const mode = pgTable("mode", {
  mode: varchar("mode", { length: 10 }).primaryKey(),
  label: text("label").notNull(),
})

export const containerType = pgTable("container_type", {
  type: varchar("type", { length: 10 }).primaryKey(),
  label: text("label").notNull(),
  dimensions: jsonb("dimensions").$type<Dimensions>().notNull(),
})

export const palletType = pgTable("pallet_type", {
  type: varchar("type", { length: 10 }).primaryKey(),
  label: text("label").notNull(),
  dimensions: jsonb("dimensions").$type<Dimensions>().notNull(),
})

export const quote = pgTable(
  "quote",
  {
    id: text("id").primaryKey(),
    source: text("source").$type<QuoteSource>().notNull().default("manual"),
    status: text("status").$type<QuoteStatus>().notNull().default("draft"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    quoteId: varchar("quote_id", { length: 6 }).notNull(),
    customerId: text("customer_id").references(() => organization.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    effectiveFrom: timestamp("effective_from"),
    expiryAt: timestamp("expiry_at"),
    currencyCode: varchar("currency_code", { length: 3 }).references(
      () => currency.code
    ),
  },
  (table) => [
    uniqueIndex("quote_organization_quote_id_uidx").on(
      table.organizationId,
      table.quoteId
    ),
  ]
)

export const laneModeValues = ["fcl", "lcl", "air"] as const
export type LaneMode = (typeof laneModeValues)[number]

export const lane = pgTable("lane", {
  id: text("id").primaryKey(),
  mode: varchar("mode", { length: 10 }).$type<LaneMode>().notNull().default("fcl"),
  pickupId: text("pickup_id").references(() => location.id),
  origin: varchar("origin", { length: 7 }).references(() => port.unlocode),
  originVia: varchar("origin_via", { length: 7 }).references(() => port.unlocode),
  destinationVia: varchar("destination_via", { length: 7 }).references(
    () => port.unlocode
  ),
  destination: varchar("destination", { length: 7 }).references(
    () => port.unlocode
  ),
  deliveryId: text("delivery_id").references(() => location.id),
  legOrder: jsonb("leg_order").$type<LegMode[]>().notNull().default([]),
  quoteId: text("quote_id")
    .notNull()
    .references(() => quote.id, { onDelete: "cascade" }),
  cargo: jsonb("cargo").$type<Cargo[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const rate = pgTable("rate", {
  id: text("id").primaryKey(),
  laneId: text("lane_id")
    .notNull()
    .references(() => lane.id, { onDelete: "cascade" }),
  currencyCode: varchar("currency_code", { length: 3 })
    .notNull()
    .references(() => currency.code),
  rate: doublePrecision("rate").notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const quoteRelations = relations(quote, ({ one, many }) => ({
  owner: one(user, {
    fields: [quote.ownerId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [quote.organizationId],
    references: [organization.id],
    relationName: "quoteOrganization",
  }),
  customer: one(organization, {
    fields: [quote.customerId],
    references: [organization.id],
    relationName: "quoteCustomer",
  }),
  currency: one(currency, {
    fields: [quote.currencyCode],
    references: [currency.code],
  }),
  lanes: many(lane),
}))

export const laneRelations = relations(lane, ({ one, many }) => ({
  quote: one(quote, {
    fields: [lane.quoteId],
    references: [quote.id],
  }),
  pickup: one(location, {
    fields: [lane.pickupId],
    references: [location.id],
    relationName: "lanePickup",
  }),
  delivery: one(location, {
    fields: [lane.deliveryId],
    references: [location.id],
    relationName: "laneDelivery",
  }),
  originPort: one(port, {
    fields: [lane.origin],
    references: [port.unlocode],
    relationName: "laneOrigin",
  }),
  originViaPort: one(port, {
    fields: [lane.originVia],
    references: [port.unlocode],
    relationName: "laneOriginVia",
  }),
  destinationViaPort: one(port, {
    fields: [lane.destinationVia],
    references: [port.unlocode],
    relationName: "laneDestinationVia",
  }),
  destinationPort: one(port, {
    fields: [lane.destination],
    references: [port.unlocode],
    relationName: "laneDestination",
  }),
  rates: many(rate),
}))

export const rateRelations = relations(rate, ({ one }) => ({
  lane: one(lane, {
    fields: [rate.laneId],
    references: [lane.id],
  }),
  currency: one(currency, {
    fields: [rate.currencyCode],
    references: [currency.code],
  }),
}))

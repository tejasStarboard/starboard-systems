import { relations } from "drizzle-orm"
import {
  doublePrecision,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

export const country = pgTable("country", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
})

export const currency = pgTable("currency", {
  code: varchar("code", { length: 3 }).primaryKey(),
})

export const state = pgTable("state", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  countryId: text("country_id")
    .notNull()
    .references(() => country.id),
})

export const city = pgTable("city", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  stateId: text("state_id")
    .notNull()
    .references(() => state.id),
  countryId: text("country_id")
    .notNull()
    .references(() => country.id),
})

export const port = pgTable("port", {
  unlocode: varchar("unlocode", { length: 7 }).primaryKey(),
  zipcode: varchar("zipcode", { length: 8 }).notNull(),
  stateId: text("state_id")
    .notNull()
    .references(() => state.id),
  countryId: text("country_id")
    .notNull()
    .references(() => country.id),
})

export const location = pgTable("location", {
  id: text("id").primaryKey(),
  address1: text("address1").notNull(),
  address2: text("address2"),
  cityId: text("city_id")
    .notNull()
    .references(() => city.id),
  stateId: text("state_id")
    .notNull()
    .references(() => state.id),
  countryId: text("country_id")
    .notNull()
    .references(() => country.id),
  zipcode: varchar("zipcode", { length: 8 }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const countryRelations = relations(country, ({ many }) => ({
  states: many(state),
  cities: many(city),
  ports: many(port),
  locations: many(location),
}))

export const stateRelations = relations(state, ({ one, many }) => ({
  country: one(country, {
    fields: [state.countryId],
    references: [country.id],
  }),
  cities: many(city),
  ports: many(port),
  locations: many(location),
}))

export const cityRelations = relations(city, ({ one, many }) => ({
  state: one(state, {
    fields: [city.stateId],
    references: [state.id],
  }),
  country: one(country, {
    fields: [city.countryId],
    references: [country.id],
  }),
  locations: many(location),
}))

export const portRelations = relations(port, ({ one }) => ({
  state: one(state, {
    fields: [port.stateId],
    references: [state.id],
  }),
  country: one(country, {
    fields: [port.countryId],
    references: [country.id],
  }),
}))

export const locationRelations = relations(location, ({ one }) => ({
  city: one(city, {
    fields: [location.cityId],
    references: [city.id],
  }),
  state: one(state, {
    fields: [location.stateId],
    references: [state.id],
  }),
  country: one(country, {
    fields: [location.countryId],
    references: [country.id],
  }),
}))

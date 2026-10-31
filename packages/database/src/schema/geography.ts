import { relations, sql } from "drizzle-orm"
import {
  boolean,
  check,
  doublePrecision,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

/** Geography service owns this Postgres schema. */
export const geoSchema = pgSchema("geo")

export const country = geoSchema.table("country", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
})

export const currency = geoSchema.table("currency", {
  code: varchar("code", { length: 3 }).primaryKey(),
})

export const state = geoSchema.table("state", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  countryId: text("country_id")
    .notNull()
    .references(() => country.id),
})

export const city = geoSchema.table("city", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  stateId: text("state_id")
    .notNull()
    .references(() => state.id),
  countryId: text("country_id")
    .notNull()
    .references(() => country.id),
})

/**
 * Facility gazetteer (ADR 0004). Replaces rigid geo.port + required zip/state.
 * Clear-and-reseed from geo.port — no prod data yet.
 */
export const facility = geoSchema.table(
  "facility",
  {
    id: text("id").primaryKey(),
    unlocode: varchar("unlocode", { length: 7 }),
    iata: varchar("iata", { length: 3 }),
    name: text("name").notNull(),
    facilityTypes: text("facility_types")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    admin1: text("admin1"),
    cityName: text("city_name"),
    aliases: text("aliases")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (table) => [
    uniqueIndex("facility_unlocode_uidx").on(table.unlocode),
    uniqueIndex("facility_iata_uidx").on(table.iata),
    check(
      "facility_has_code",
      sql`${table.unlocode} is not null or ${table.iata} is not null`
    ),
  ]
)

export const location = geoSchema.table("location", {
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
  locations: many(location),
}))

export const stateRelations = relations(state, ({ one, many }) => ({
  country: one(country, {
    fields: [state.countryId],
    references: [country.id],
  }),
  cities: many(city),
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

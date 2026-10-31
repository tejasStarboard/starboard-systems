import { relations, sql } from "drizzle-orm"
import {
  bigint,
  boolean,
  check,
  customType,
  doublePrecision,
  index,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

/** Geography service owns this Postgres schema. */
export const geoSchema = pgSchema("geo")

/** Opaque PostGIS geometry (driver returns EWKB/hex); queries use ST_* in SQL. */
const multiPolygon4326 = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geometry(MultiPolygon,4326)"
  },
})

const polygon4326 = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geometry(Polygon,4326)"
  },
})

export const country = geoSchema.table("country", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
})

export const currency = geoSchema.table("currency", {
  code: varchar("code", { length: 3 }).primaryKey(),
})

export const state = geoSchema.table(
  "state",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    countryId: text("country_id")
      .notNull()
      .references(() => country.id),
  },
  (table) => [index("state_country_id_idx").on(table.countryId)]
)

export const city = geoSchema.table(
  "city",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    stateId: text("state_id")
      .notNull()
      .references(() => state.id),
    countryId: text("country_id")
      .notNull()
      .references(() => country.id),
  },
  (table) => [
    index("city_state_id_idx").on(table.stateId),
    index("city_country_id_idx").on(table.countryId),
  ]
)

/**
 * City / admin polygons from starboard-2 geo_city_boundaries (local PostGIS).
 * Not loaded on Neon Free (size); leave empty unless a larger DB is provisioned.
 */
export const cityBoundary = geoSchema.table(
  "city_boundary",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    admin1Code: text("admin1_code").notNull(),
    name: text("name").notNull(),
    nameNormalized: text("name_normalized").notNull(),
    googlePlaceId: text("google_place_id"),
    formattedAddress: text("formatted_address"),
    osmId: bigint("osm_id", { mode: "number" }),
    adminLevel: text("admin_level"),
    polygonSource: text("polygon_source"),
    aliases: text("aliases")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    geom: multiPolygon4326("geom"),
    bboxGeom: polygon4326("bbox_geom"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    geomFingerprint: text("geom_fingerprint"),
    isActive: boolean("is_active").notNull().default(true),
    radialRadiusKm: doublePrecision("radial_radius_km"),
  },
  (table) => [
    uniqueIndex("city_boundary_google_place_uidx").on(table.googlePlaceId),
    uniqueIndex("city_boundary_region_name_uidx").on(
      table.countryCode,
      table.admin1Code,
      table.nameNormalized
    ),
    index("city_boundary_country_active_idx").on(
      table.countryCode,
      table.isActive
    ),
    index("city_boundary_osm_id_idx").on(table.osmId),
  ]
)

/**
 * Facility gazetteer (ADR 0004). Replaces rigid geo.port + required zip/state.
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
    cityBoundaryId: bigint("city_boundary_id", { mode: "number" }).references(
      () => cityBoundary.id
    ),
  },
  (table) => [
    uniqueIndex("facility_unlocode_uidx").on(table.unlocode),
    uniqueIndex("facility_iata_uidx").on(table.iata),
    index("facility_country_code_idx").on(table.countryCode),
    index("facility_primary_name_idx").on(table.isPrimary, table.name),
    index("facility_city_boundary_id_idx").on(table.cityBoundaryId),
    check(
      "facility_has_code",
      sql`${table.unlocode} is not null or ${table.iata} is not null`
    ),
  ]
)

export const location = geoSchema.table(
  "location",
  {
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
  },
  (table) => [
    index("location_city_id_idx").on(table.cityId),
    index("location_state_id_idx").on(table.stateId),
    index("location_country_id_idx").on(table.countryId),
  ]
)

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

export const cityBoundaryRelations = relations(cityBoundary, ({ many }) => ({
  facilities: many(facility),
}))

export const facilityRelations = relations(facility, ({ one }) => ({
  cityBoundary: one(cityBoundary, {
    fields: [facility.cityBoundaryId],
    references: [cityBoundary.id],
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

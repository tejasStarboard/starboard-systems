import { config } from "dotenv"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { createDb } from "../client"
import { country, facility, state } from "../schema/geography"
import { containerType, palletType } from "../schema/quote"
import {
  defaultCountries,
  defaultFacilities,
  defaultStates,
} from "./geography-data"
import { defaultContainerTypes, defaultPalletTypes } from "./reference-data"

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..")
config({ path: resolve(rootDir, ".env") })

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not set")
}

async function seed() {
  const db = createDb(process.env.POSTGRES_URL!)

  for (const row of defaultContainerTypes) {
    await db
      .insert(containerType)
      .values(row)
      .onConflictDoUpdate({
        target: containerType.type,
        set: {
          label: row.label,
          dimensions: row.dimensions,
        },
      })
  }

  for (const row of defaultPalletTypes) {
    await db
      .insert(palletType)
      .values(row)
      .onConflictDoUpdate({
        target: palletType.type,
        set: {
          label: row.label,
          dimensions: row.dimensions,
        },
      })
  }

  for (const row of defaultCountries) {
    await db.insert(country).values(row).onConflictDoNothing({
      target: country.id,
    })
  }

  for (const row of defaultStates) {
    await db.insert(state).values(row).onConflictDoNothing({
      target: state.id,
    })
  }

  for (const row of defaultFacilities) {
    await db
      .insert(facility)
      .values({
        id: row.id,
        unlocode: row.unlocode ?? null,
        iata: row.iata ?? null,
        name: row.name,
        facilityTypes: row.facilityTypes,
        countryCode: row.countryCode,
        admin1: row.admin1 ?? null,
        cityName: row.cityName ?? null,
        aliases: row.aliases ?? [],
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        isPrimary: row.isPrimary ?? false,
      })
      .onConflictDoNothing({
        target: facility.id,
      })
  }

  console.log(
    `Seeded ${defaultContainerTypes.length} container types, ${defaultPalletTypes.length} pallet types, and ${defaultFacilities.length} facilities`
  )
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})

import { config } from "dotenv"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { createDb } from "../client"
import { country, port, state } from "../schema/geography"
import { containerType, palletType } from "../schema/quote"
import { defaultCountries, defaultPorts, defaultStates } from "./geography-data"
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

  for (const row of defaultPorts) {
    await db.insert(port).values(row).onConflictDoNothing({
      target: port.unlocode,
    })
  }

  console.log(
    `Seeded ${defaultContainerTypes.length} container types, ${defaultPalletTypes.length} pallet types, and ${defaultPorts.length} ports`
  )
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})

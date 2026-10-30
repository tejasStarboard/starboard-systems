import { createDb, type Database } from "@starboard/db"

export type RatesDb = Database

export function createRatesDb(connectionString: string): RatesDb {
  return createDb(connectionString)
}

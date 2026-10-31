import { createDb, type Database } from "@starboard/lib-db"

export type RatesDb = Database

export function createRatesDb(connectionString: string): RatesDb {
  return createDb(connectionString)
}

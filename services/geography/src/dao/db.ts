import { createDb, type Database } from "@starboard/db"

export type GeographyDb = Database

export function createGeographyDb(connectionString: string): GeographyDb {
  return createDb(connectionString)
}

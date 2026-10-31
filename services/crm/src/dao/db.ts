import { createDb, type Database } from "@starboard/lib-db"

export type CrmDb = Database

export function createCrmDb(connectionString: string): CrmDb {
  return createDb(connectionString)
}

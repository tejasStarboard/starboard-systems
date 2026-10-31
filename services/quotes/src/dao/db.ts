import { createDb, type Database } from "@starboard/lib-db"

export type QuotesDb = Database

export function createQuotesDb(connectionString: string): QuotesDb {
  return createDb(connectionString)
}

import { neon, type NeonQueryFunction } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"

import * as schema from "./schema/index"

export type Database = NeonHttpDatabase<typeof schema> & {
  $client: NeonQueryFunction<false, false>
}

export function createDb(connectionString: string): Database {
  const sql = neon(connectionString)
  return drizzle(sql, { schema })
}

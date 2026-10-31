import { neon } from "@neondatabase/serverless"
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http"
import type { NeonHttpDatabase } from "drizzle-orm/neon-http"
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema/index"

/**
 * Shared Drizzle DB handle. Runtime uses neon-http remotely and node-postgres
 * locally; the NeonHttpDatabase shape is the compile-time contract (APIs match).
 */
export type Database = NeonHttpDatabase<typeof schema>

function useNodePostgres(connectionString: string): boolean {
  const driver = process.env.DATABASE_DRIVER?.trim().toLowerCase()
  if (driver === "pg" || driver === "node-postgres" || driver === "postgres") {
    return true
  }
  if (driver === "neon") {
    return false
  }

  try {
    const normalized = connectionString.replace(/^postgresql:/i, "http:")
    const host = new URL(normalized).hostname
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "host.docker.internal"
    )
  } catch {
    return false
  }
}

export function createDb(connectionString: string): Database {
  if (useNodePostgres(connectionString)) {
    const pool = new Pool({ connectionString })
    return drizzleNodePostgres(pool, {
      schema,
    }) as unknown as Database
  }

  const sql = neon(connectionString)
  return drizzleNeonHttp(sql, { schema })
}

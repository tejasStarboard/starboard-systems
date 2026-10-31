/**
 * CI helper: enable PostGIS, push Drizzle schema, then assert core tables exist.
 * drizzle-kit push can exit 0 after SQL errors — verification is required.
 */
import { config } from "dotenv"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"
import pg from "pg"

config({ path: resolve(import.meta.dirname, "../../../.env") })

const url = process.env.POSTGRES_URL
if (!url) {
  console.error("POSTGRES_URL is not set")
  process.exit(1)
}

const client = new pg.Client({ connectionString: url })

async function main() {
  await client.connect()

  await client.query(`CREATE EXTENSION IF NOT EXISTS postgis`)
  await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`)

  const push = spawnSync("pnpm", ["exec", "drizzle-kit", "push", "--force"], {
    cwd: resolve(import.meta.dirname, ".."),
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })

  const combined = `${push.stdout ?? ""}\n${push.stderr ?? ""}`
  process.stdout.write(push.stdout ?? "")
  process.stderr.write(push.stderr ?? "")

  // drizzle-kit has been observed exiting 0 after fatal SQL errors
  const failedPush =
    push.status !== 0 ||
    /\berror:\b/i.test(combined) ||
    /\bError:/i.test(combined)

  if (failedPush) {
    console.error("drizzle-kit push failed")
    process.exit(push.status && push.status !== 0 ? push.status : 1)
  }

  const checks = [
    {
      name: "crm.customer",
      sql: `SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'crm' AND table_name = 'customer'`,
    },
    {
      name: "crm.customer.country_code",
      sql: `SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'crm' AND table_name = 'customer'
              AND column_name = 'country_code'`,
    },
    {
      name: "crm.contact",
      sql: `SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'crm' AND table_name = 'contact'`,
    },
    {
      name: "geo.facility",
      sql: `SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'geo' AND table_name = 'facility'`,
    },
    {
      name: "quotes.quote",
      sql: `SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'quotes' AND table_name = 'quote'`,
    },
  ]

  for (const check of checks) {
    const { rows } = await client.query(check.sql)
    if (rows.length === 0) {
      console.error(`Schema check failed: missing ${check.name}`)
      process.exit(1)
    }
  }

  console.log(`Schema push verified (${checks.length} checks)`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await client.end().catch(() => undefined)
  })

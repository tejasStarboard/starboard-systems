import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
config({ path: resolve(rootDir, ".env") })

if (!process.env.POSTGRES_URL && !process.env.POSTGRES_URL_UNPOOLED) {
  throw new Error("POSTGRES_URL is not set")
}

/**
 * drizzle-kit push introspects via many sequential queries. Neon's pooled
 * (-pooler) endpoint + interactive rename/data-loss prompts make that look
 * "stuck". Prefer a direct endpoint for kit commands only (runtime can stay pooled).
 */
function resolveKitDatabaseUrl(): string {
  const explicit = process.env.POSTGRES_URL_UNPOOLED?.trim()
  if (explicit) return explicit

  const url = process.env.POSTGRES_URL!.trim()
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes("-pooler.")) {
      parsed.hostname = parsed.hostname.replace("-pooler.", ".")
    }
    return parsed.toString()
  } catch {
    return url
  }
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Required so push/migrate manage service-owned schemas (default is public-only).
  schemaFilter: [
    "public",
    "geo",
    "quotes",
    "crm",
    "rates",
    "platform",
    "messaging",
  ],
  // Ignore PostGIS catalog tables so push does not prompt rename conflicts
  // against spatial_ref_sys (breaks non-interactive CI).
  extensionsFilters: ["postgis"],
  dbCredentials: {
    url: resolveKitDatabaseUrl(),
  },
})

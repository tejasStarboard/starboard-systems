import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
config({ path: resolve(rootDir, ".env") })

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not set")
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Required so push/migrate manage service-owned schemas (default is public-only).
  schemaFilter: ["public", "geo", "quotes", "crm"],
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
})

import { config as loadDotenv } from "dotenv"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
loadDotenv({ path: resolve(rootDir, ".env") })

export type RatesConfig = {
  port: number
  postgresUrl: string
  serviceToken: string
  serviceName: string
}

export function loadConfig(
  env: Record<string, string | undefined> = process.env
): RatesConfig {
  const postgresUrl = env.POSTGRES_URL
  const serviceToken = env.INTERNAL_SERVICE_TOKEN

  if (!postgresUrl) {
    throw new Error("POSTGRES_URL is required")
  }
  if (!serviceToken) {
    throw new Error("INTERNAL_SERVICE_TOKEN is required")
  }

  return {
    port: Number(env.RATES_SERVICE_PORT ?? "3104"),
    postgresUrl,
    serviceToken,
    serviceName: "rates",
  }
}

import { Hono } from "hono"
import type { ServiceVariables } from "@starboard/service-kit"
import { logError, logInfo } from "@starboard/service-kit"

import type { GeographyService } from "../domain/geography.service"
import { GeographyValidationError } from "../domain/geography.service"

export function createGeographyController(service: GeographyService) {
  const app = new Hono<{ Variables: ServiceVariables }>()

  app.get("/currencies", async (c) => {
    const requestId = c.get("requestId")
    try {
      const currencies = await service.listCurrencies()
      logInfo("geography", requestId, "list_currencies", {
        count: currencies.length,
      })
      return c.json({ currencies })
    } catch (error) {
      logError("geography", requestId, "list_currencies_failed", {
        error: error instanceof Error ? error.message : String(error),
      })
      return c.json({ error: "Internal server error" }, 500)
    }
  })

  app.post("/currencies", async (c) => {
    const requestId = c.get("requestId")
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    try {
      const code =
        typeof body === "object" && body !== null && "code" in body
          ? String((body as { code: unknown }).code)
          : ""
      const result = await service.ensureCurrency(code)
      logInfo("geography", requestId, "ensure_currency", { code: result.code })
      return c.json(result)
    } catch (error) {
      if (error instanceof GeographyValidationError) {
        return c.json({ error: error.message }, error.status)
      }
      logError("geography", requestId, "ensure_currency_failed", {
        error: error instanceof Error ? error.message : String(error),
      })
      return c.json({ error: "Internal server error" }, 500)
    }
  })

  app.get("/ports", async (c) => {
    const requestId = c.get("requestId")
    try {
      const q = c.req.query("q") ?? ""
      const ports = await service.searchPorts(q)
      logInfo("geography", requestId, "search_ports", {
        q,
        count: ports.length,
      })
      return c.json({ ports })
    } catch (error) {
      if (error instanceof GeographyValidationError) {
        return c.json({ error: error.message }, error.status)
      }
      logError("geography", requestId, "search_ports_failed", {
        error: error instanceof Error ? error.message : String(error),
      })
      return c.json({ error: "Internal server error" }, 500)
    }
  })

  return app
}

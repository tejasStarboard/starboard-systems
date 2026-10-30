import { Hono } from "hono"
import {
  createRateRequestSchema,
  listRatesQuerySchema,
} from "@starboard/contracts"
import {
  logError,
  logInfo,
  type ServiceVariables,
} from "@starboard/service-kit"

import type { RatesService } from "../domain/rates.service"
import {
  RatesNotFoundError,
  RatesValidationError,
} from "../domain/rates.service"

export function createRatesController(service: RatesService) {
  const app = new Hono<{ Variables: ServiceVariables }>()

  app.get("/rates", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""

    const query = listRatesQuerySchema.safeParse({
      q: c.req.query("q") ?? "",
      origin: c.req.query("origin") ?? "",
      destination: c.req.query("destination") ?? "",
      customerId: c.req.query("customerId") ?? "",
      validAt: c.req.query("validAt") ?? "",
    })
    if (!query.success) {
      return c.json(
        { error: query.error.issues[0]?.message ?? "Invalid query" },
        400
      )
    }

    try {
      const rates = await service.list(organizationId, query.data)
      logInfo("rates", requestId, "list_rates", {
        organizationId,
        count: rates.length,
      })
      return c.json({ rates })
    } catch (error) {
      return handleError(c, requestId, "list_rates_failed", error)
    }
  })

  app.post("/rates", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    const parsed = createRateRequestSchema.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        400
      )
    }

    try {
      const created = await service.create(organizationId, parsed.data)
      logInfo("rates", requestId, "create_rate", { id: created.id })
      return c.json(created, 201)
    } catch (error) {
      return handleError(c, requestId, "create_rate_failed", error)
    }
  })

  app.get("/rates/:id", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""
    const id = c.req.param("id")

    try {
      const rate = await service.get(organizationId, id)
      logInfo("rates", requestId, "get_rate", { id: rate.id })
      return c.json(rate)
    } catch (error) {
      return handleError(c, requestId, "get_rate_failed", error)
    }
  })

  return app
}

function handleError(
  c: { json: (body: unknown, status?: number) => Response },
  requestId: string,
  event: string,
  error: unknown
) {
  if (error instanceof RatesValidationError) {
    return c.json({ error: error.message }, error.status)
  }
  if (error instanceof RatesNotFoundError) {
    return c.json({ error: error.message }, error.status)
  }

  logError("rates", requestId, event, {
    error: error instanceof Error ? error.message : String(error),
  })
  return c.json({ error: "Internal server error" }, 500)
}

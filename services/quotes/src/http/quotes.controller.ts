import { Hono } from "hono"
import {
  createQuoteRequestSchema,
  saveQuoteRequestSchema,
} from "@starboard/lib-contracts"
import {
  logError,
  logInfo,
  type ServiceVariables,
} from "@starboard/lib-service-kit"

import type { QuotesService } from "../domain/quotes.service"
import {
  QuotesNotFoundError,
  QuotesValidationError,
} from "../domain/quotes.service"

export function createQuotesController(service: QuotesService) {
  const app = new Hono<{ Variables: ServiceVariables }>()

  app.get("/quotes", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""

    try {
      const quotes = await service.list(organizationId)
      logInfo("quotes", requestId, "list_quotes", {
        organizationId,
        count: quotes.length,
      })
      return c.json({ quotes })
    } catch (error) {
      return handleError(c, requestId, "list_quotes_failed", error)
    }
  })

  app.post("/quotes", async (c) => {
    const requestId = c.get("requestId")
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    const organizationId = c.get("organizationId")
    const parsed = createQuoteRequestSchema.safeParse({
      ...(typeof body === "object" && body !== null ? body : {}),
      ...(organizationId ? { organizationId } : {}),
    })

    if (!parsed.success) {
      return c.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        400
      )
    }

    try {
      const created = await service.create(parsed.data)
      logInfo("quotes", requestId, "create_quote", { id: created.id })
      return c.json(created, 201)
    } catch (error) {
      return handleError(c, requestId, "create_quote_failed", error)
    }
  })

  app.get("/quotes/:quoteId", async (c) => {
    const requestId = c.get("requestId")
    const quoteId = c.req.param("quoteId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""

    try {
      const quote = await service.get(quoteId, organizationId)
      return c.json({ quote })
    } catch (error) {
      return handleError(c, requestId, "get_quote_failed", error)
    }
  })

  app.put("/quotes/:quoteId", async (c) => {
    const requestId = c.get("requestId")
    const quoteId = c.req.param("quoteId")
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    if (typeof body !== "object" || body === null) {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    const record = body as Record<string, unknown>
    const organizationId = c.get("organizationId")
    const quoteBody =
      typeof record.quote === "object" && record.quote !== null
        ? record.quote
        : record

    const parsed = saveQuoteRequestSchema.safeParse({
      ownerId: record.ownerId,
      organizationId: organizationId || record.organizationId,
      quote: { ...quoteBody, id: quoteId },
    })

    if (!parsed.success) {
      return c.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid quote" },
        400
      )
    }

    try {
      const saved = await service.save(parsed.data.quote, {
        ownerId: parsed.data.ownerId,
        organizationId: parsed.data.organizationId,
      })
      logInfo("quotes", requestId, "save_quote", { id: saved.id })
      return c.json(saved)
    } catch (error) {
      return handleError(c, requestId, "save_quote_failed", error)
    }
  })

  app.get("/reference/container-types", async (c) => {
    const requestId = c.get("requestId")
    try {
      const containerTypes = await service.listContainerTypes()
      return c.json({ containerTypes })
    } catch (error) {
      return handleError(c, requestId, "list_container_types_failed", error)
    }
  })

  app.get("/reference/pallet-types", async (c) => {
    const requestId = c.get("requestId")
    try {
      const palletTypes = await service.listPalletTypes()
      return c.json({ palletTypes })
    } catch (error) {
      return handleError(c, requestId, "list_pallet_types_failed", error)
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
  if (error instanceof QuotesValidationError) {
    return c.json({ error: error.message }, error.status)
  }
  if (error instanceof QuotesNotFoundError) {
    return c.json({ error: error.message }, error.status)
  }

  logError("quotes", requestId, event, {
    error: error instanceof Error ? error.message : String(error),
  })
  return c.json({ error: "Internal server error" }, 500)
}

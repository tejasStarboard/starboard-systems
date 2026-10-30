import { Hono } from "hono"
import { createCustomerRequestSchema } from "@starboard/contracts"
import {
  logError,
  logInfo,
  type ServiceVariables,
} from "@starboard/service-kit"

import type { CrmService } from "../domain/crm.service"
import { CrmValidationError } from "../domain/crm.service"

export function createCrmController(service: CrmService) {
  const app = new Hono<{ Variables: ServiceVariables }>()

  app.get("/customers", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""

    try {
      const customers = await service.list(organizationId)
      logInfo("crm", requestId, "list_customers", {
        organizationId,
        count: customers.length,
      })
      return c.json({ customers })
    } catch (error) {
      return handleError(c, requestId, "list_customers_failed", error)
    }
  })

  app.post("/customers", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    const parsed = createCustomerRequestSchema.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        400
      )
    }

    try {
      const created = await service.create(organizationId, parsed.data.name)
      logInfo("crm", requestId, "create_customer", { id: created.id })
      return c.json(created, 201)
    } catch (error) {
      return handleError(c, requestId, "create_customer_failed", error)
    }
  })

  app.get("/customers/names", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""
    const ids = c.req.query("ids") ?? ""

    try {
      const customers = await service.getNamesByIds(
        organizationId,
        ids
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      )
      logInfo("crm", requestId, "get_customer_names", {
        organizationId,
        count: customers.length,
      })
      return c.json({ customers })
    } catch (error) {
      return handleError(c, requestId, "get_customer_names_failed", error)
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
  if (error instanceof CrmValidationError) {
    return c.json({ error: error.message }, error.status)
  }

  logError("crm", requestId, event, {
    error: error instanceof Error ? error.message : String(error),
  })
  return c.json({ error: "Internal server error" }, 500)
}

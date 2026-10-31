import { Hono } from "hono"
import {
  createContactRequestSchema,
  createCustomerRequestSchema,
  crmListQuerySchema,
  updateContactRequestSchema,
  updateCustomerRequestSchema,
} from "@starboard/lib-contracts"
import {
  logError,
  logInfo,
  type ServiceVariables,
} from "@starboard/lib-service-kit"

import type { CrmService } from "../domain/crm.service"
import { CrmNotFoundError, CrmValidationError } from "../domain/crm.service"

export function createCrmController(service: CrmService) {
  const app = new Hono<{ Variables: ServiceVariables }>()

  app.get("/customers", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""
    const detail = c.req.query("detail") === "1"

    try {
      if (detail) {
        const query = crmListQuerySchema.parse({
          page: c.req.query("page") ?? undefined,
          pageSize: c.req.query("pageSize") ?? undefined,
          q: c.req.query("q") ?? "",
        })
        const result = await service.listRecords(organizationId, query)
        logInfo("crm", requestId, "list_customer_records", {
          organizationId,
          count: result.customers.length,
          page: result.page,
          total: result.total,
        })
        return c.json(result)
      }

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
      const created = await service.create(organizationId, parsed.data)
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

  app.get("/customers/:customerId", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""
    const customerId = c.req.param("customerId")

    try {
      const customer = await service.get(organizationId, customerId)
      return c.json(customer)
    } catch (error) {
      return handleError(c, requestId, "get_customer_failed", error)
    }
  })

  app.patch("/customers/:customerId", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""
    const customerId = c.req.param("customerId")

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    const parsed = updateCustomerRequestSchema.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        400
      )
    }

    try {
      const updated = await service.update(
        organizationId,
        customerId,
        parsed.data
      )
      logInfo("crm", requestId, "update_customer", { id: updated.id })
      return c.json(updated)
    } catch (error) {
      return handleError(c, requestId, "update_customer_failed", error)
    }
  })

  app.get("/customers/:customerId/contacts", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""
    const customerId = c.req.param("customerId")

    try {
      const query = crmListQuerySchema.parse({
        page: c.req.query("page") ?? undefined,
        pageSize: c.req.query("pageSize") ?? undefined,
        q: c.req.query("q") ?? "",
      })
      const result = await service.listContacts(
        organizationId,
        customerId,
        query
      )
      return c.json(result)
    } catch (error) {
      return handleError(c, requestId, "list_contacts_failed", error)
    }
  })

  app.post("/customers/:customerId/contacts", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""
    const customerId = c.req.param("customerId")

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    const parsed = createContactRequestSchema.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        400
      )
    }

    try {
      const created = await service.createContact(
        organizationId,
        customerId,
        parsed.data
      )
      logInfo("crm", requestId, "create_contact", { id: created.id })
      return c.json(created, 201)
    } catch (error) {
      return handleError(c, requestId, "create_contact_failed", error)
    }
  })

  app.patch("/customers/:customerId/contacts/:contactId", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""
    const customerId = c.req.param("customerId")
    const contactId = c.req.param("contactId")

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    const parsed = updateContactRequestSchema.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        400
      )
    }

    try {
      const updated = await service.updateContact(
        organizationId,
        customerId,
        contactId,
        parsed.data
      )
      return c.json(updated)
    } catch (error) {
      return handleError(c, requestId, "update_contact_failed", error)
    }
  })

  app.delete("/customers/:customerId/contacts/:contactId", async (c) => {
    const requestId = c.get("requestId")
    const organizationId =
      c.get("organizationId") || c.req.query("organizationId") || ""
    const customerId = c.req.param("customerId")
    const contactId = c.req.param("contactId")

    try {
      await service.deleteContact(organizationId, customerId, contactId)
      return c.body(null, 204)
    } catch (error) {
      return handleError(c, requestId, "delete_contact_failed", error)
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
  if (
    error instanceof CrmValidationError ||
    error instanceof CrmNotFoundError
  ) {
    return c.json({ error: error.message }, error.status)
  }

  logError("crm", requestId, event, {
    error: error instanceof Error ? error.message : String(error),
  })
  return c.json({ error: "Internal server error" }, 500)
}

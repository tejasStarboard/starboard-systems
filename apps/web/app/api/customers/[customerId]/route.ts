import { NextResponse } from "next/server"
import { updateCustomerRequestSchema } from "@starboard/lib-contracts"

import { requireApiSession } from "@/lib/auth/session"
import { ServiceClientError } from "@/lib/clients/http"
import { getCrmManager } from "@/lib/domain/crm/crm.manager"

type RouteContext = {
  params: Promise<{ customerId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { customerId } = await context.params

  try {
    const customer = await getCrmManager().getCustomer(
      authResult.organizationId,
      customerId
    )
    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof ServiceClientError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    throw error
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { customerId } = await context.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = updateCustomerRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    )
  }

  try {
    const updated = await getCrmManager().updateCustomer(
      authResult.organizationId,
      customerId,
      parsed.data
    )
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof ServiceClientError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    throw error
  }
}

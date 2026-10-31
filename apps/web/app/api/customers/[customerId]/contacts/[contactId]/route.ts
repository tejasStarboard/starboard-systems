import { NextResponse } from "next/server"
import { updateContactRequestSchema } from "@starboard/lib-contracts"

import { requireApiSession } from "@/lib/auth/session"
import { ServiceClientError } from "@/lib/clients/http"
import { getCrmManager } from "@/lib/domain/crm/crm.manager"

type RouteContext = {
  params: Promise<{ customerId: string; contactId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { customerId, contactId } = await context.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = updateContactRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    )
  }

  try {
    const updated = await getCrmManager().updateContact(
      authResult.organizationId,
      customerId,
      contactId,
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

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { customerId, contactId } = await context.params

  try {
    await getCrmManager().deleteContact(
      authResult.organizationId,
      customerId,
      contactId
    )
    return new NextResponse(null, { status: 204 })
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

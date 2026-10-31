import { NextResponse } from "next/server"
import {
  createContactRequestSchema,
  crmListQuerySchema,
} from "@starboard/lib-contracts"

import { requireApiSession } from "@/lib/auth/session"
import { ServiceClientError } from "@/lib/clients/http"
import { getCrmManager } from "@/lib/domain/crm/crm.manager"

type RouteContext = {
  params: Promise<{ customerId: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { customerId } = await context.params
  const searchParams = new URL(request.url).searchParams
  const query = crmListQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    q: searchParams.get("q") ?? "",
  })

  try {
    const result = await getCrmManager().listContacts(
      authResult.organizationId,
      customerId,
      query
    )
    return NextResponse.json(result)
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

export async function POST(request: Request, context: RouteContext) {
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

  const parsed = createContactRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    )
  }

  try {
    const created = await getCrmManager().createContact(
      authResult.organizationId,
      customerId,
      parsed.data
    )
    return NextResponse.json(created, { status: 201 })
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

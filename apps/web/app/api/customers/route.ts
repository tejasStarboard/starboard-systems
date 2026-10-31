import { NextResponse } from "next/server"
import {
  createCustomerRequestSchema,
  crmListQuerySchema,
} from "@starboard/lib-contracts"

import { requireApiSession } from "@/lib/auth/session"
import { ServiceClientError } from "@/lib/clients/http"
import { getCrmManager } from "@/lib/domain/crm/crm.manager"

export async function GET(request: Request) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const searchParams = new URL(request.url).searchParams
  const detail = searchParams.get("detail") === "1"

  try {
    if (detail) {
      const query = crmListQuerySchema.parse({
        page: searchParams.get("page") ?? undefined,
        pageSize: searchParams.get("pageSize") ?? undefined,
        q: searchParams.get("q") ?? "",
      })
      const result = await getCrmManager().listCustomerRecords(
        authResult.organizationId,
        query
      )
      return NextResponse.json(result)
    }

    const customers = await getCrmManager().listCustomerOptions(
      authResult.organizationId
    )
    return NextResponse.json({ customers })
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

export async function POST(request: Request) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = createCustomerRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    )
  }

  try {
    const created = await getCrmManager().createCustomerForOrg(
      authResult.organizationId,
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

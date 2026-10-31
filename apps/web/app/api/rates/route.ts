import { NextResponse } from "next/server"
import {
  createRateRequestSchema,
  listRatesQuerySchema,
} from "@starboard/contracts"

import { requireApiSession } from "@/lib/auth/session"
import { ServiceClientError } from "@/lib/clients/http"
import { getRatesManager } from "@/lib/domain/rates/rates.manager"

export async function GET(request: Request) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const url = new URL(request.url)
  const parsed = listRatesQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    origin: url.searchParams.get("origin") ?? "",
    destination: url.searchParams.get("destination") ?? "",
    customerId: url.searchParams.get("customerId") ?? "",
    validAt: url.searchParams.get("validAt") ?? "",
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid query" },
      { status: 400 }
    )
  }

  try {
    const rates = await getRatesManager().listRatesForOrg(
      authResult.organizationId,
      parsed.data
    )
    return NextResponse.json({ rates })
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

  const parsed = createRateRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    )
  }

  try {
    const created = await getRatesManager().createRateForOrg(
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

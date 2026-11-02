import { NextResponse } from "next/server"
import { updateRateRequestSchema } from "@starboard/lib-contracts"

import { requireApiSession } from "@/lib/auth/session"
import { ServiceClientError } from "@/lib/clients/http"
import { getRatesManager } from "@/lib/domain/rates/rates.manager"

export async function GET(
  _request: Request,
  context: { params: Promise<{ rateId: string }> }
) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { rateId } = await context.params

  try {
    const rate = await getRatesManager().getRateForOrg(
      authResult.organizationId,
      rateId
    )
    return NextResponse.json(rate)
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ rateId: string }> }
) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { rateId } = await context.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = updateRateRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    )
  }

  try {
    const rate = await getRatesManager().updateRateForOrg(
      authResult.organizationId,
      rateId,
      parsed.data
    )
    return NextResponse.json(rate)
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ rateId: string }> }
) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { rateId } = await context.params

  try {
    await getRatesManager().deleteRateForOrg(authResult.organizationId, rateId)
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

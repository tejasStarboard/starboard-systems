import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { ServiceClientError } from "@/lib/clients/http"
import { getMessagingManager } from "@/lib/domain/messaging/messaging.manager"
import { isExtensionActive } from "@/lib/extensions"

export async function POST(request: Request) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const organizationId = authResult.session.session.activeOrganizationId!
  const plan = await getOrganizationPlan(organizationId)
  if (!isExtensionActive("messaging.msgraph", plan)) {
    return NextResponse.json(
      { error: "Extension messaging.msgraph is not enabled" },
      { status: 404 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 })
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { toAddress?: unknown }).toAddress !== "string" ||
    typeof (body as { subject?: unknown }).subject !== "string" ||
    typeof (body as { body?: unknown }).body !== "string"
  ) {
    return NextResponse.json(
      { error: "toAddress, subject, and body are required" },
      { status: 400 }
    )
  }

  const payload = body as {
    toAddress: string
    subject: string
    body: string
    quoteId?: string
  }

  try {
    const result = await getMessagingManager().sendMail({
      organizationId,
      toAddress: payload.toAddress,
      subject: payload.subject,
      body: payload.body,
      quoteId: payload.quoteId,
    })
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

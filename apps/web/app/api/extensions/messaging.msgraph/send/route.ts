import { NextResponse } from "next/server"

import { requireActiveExtension } from "@/lib/auth/require-active-extension"
import { ServiceClientError } from "@/lib/clients/http"
import { getMessagingManager } from "@/lib/domain/messaging/messaging.manager"

export async function POST(request: Request) {
  const gate = await requireActiveExtension("messaging.msgraph")
  if (gate.error) {
    return gate.error
  }
  const organizationId = gate.organizationId

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

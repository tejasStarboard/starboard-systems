import { NextResponse } from "next/server"

import { requireActiveExtension } from "@/lib/auth/require-active-extension"
import { ServiceClientError } from "@/lib/clients/http"
import { getMessagingManager } from "@/lib/domain/messaging/messaging.manager"

export async function GET() {
  const gate = await requireActiveExtension("messaging.msgraph")
  if (gate.error) {
    return gate.error
  }
  const organizationId = gate.organizationId

  try {
    const result = await getMessagingManager().listMessages(organizationId)
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

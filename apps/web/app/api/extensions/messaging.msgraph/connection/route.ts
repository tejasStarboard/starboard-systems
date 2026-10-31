import { NextResponse } from "next/server"

import { requireActiveExtension } from "@/lib/auth/require-active-extension"
import { ServiceClientError } from "@/lib/clients/http"
import { getMessagingManager } from "@/lib/domain/messaging/messaging.manager"

async function requireMessagingSession() {
  return requireActiveExtension("messaging.msgraph")
}

export async function GET() {
  const gate = await requireMessagingSession()
  if (gate.error) {
    return gate.error
  }

  try {
    const result = await getMessagingManager().getConnection(
      gate.organizationId
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

export async function POST() {
  const gate = await requireMessagingSession()
  if (gate.error) {
    return gate.error
  }

  try {
    const started = await getMessagingManager().startConnection(
      gate.organizationId
    )
    // Vertical slice: complete stub OAuth immediately after start.
    const result = await getMessagingManager().completeConnection(
      gate.organizationId,
      "stub"
    )
    return NextResponse.json({
      ...result,
      authUrl: started.authUrl ?? null,
    })
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

export async function DELETE() {
  const gate = await requireMessagingSession()
  if (gate.error) {
    return gate.error
  }

  try {
    const result = await getMessagingManager().disconnect(gate.organizationId)
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

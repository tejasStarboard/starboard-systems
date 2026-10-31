import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { ServiceClientError } from "@/lib/clients/http"
import { getMessagingManager } from "@/lib/domain/messaging/messaging.manager"
import { isExtensionActive } from "@/lib/extensions"

export async function GET() {
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

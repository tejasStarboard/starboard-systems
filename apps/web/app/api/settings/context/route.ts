import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { getMessagingManager } from "@/lib/domain/messaging/messaging.manager"
import { isExtensionActive } from "@/lib/extensions"

const MESSAGING_EXTENSION_ID = "messaging.msgraph"

/**
 * Plan + active connection-based integrations for the `org.settings` billing
 * and integrations editors (they cannot read server state directly).
 */
export async function GET() {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { organizationId } = authResult
  const plan = await getOrganizationPlan(organizationId)
  const messagingActive = await isExtensionActive(
    MESSAGING_EXTENSION_ID,
    plan,
    organizationId
  )

  const integrations: Array<{
    extensionId: string
    displayName: string
    status: string
  }> = []
  if (messagingActive) {
    let status = "disconnected"
    try {
      const connection =
        await getMessagingManager().getConnection(organizationId)
      status = connection.status
    } catch {
      status = "disconnected"
    }
    integrations.push({
      extensionId: MESSAGING_EXTENSION_ID,
      displayName: "Microsoft Outlook",
      status,
    })
  }

  return NextResponse.json({ plan, integrations })
}

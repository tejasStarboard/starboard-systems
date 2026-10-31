import { ConnectOutlook } from "@/components/messaging/connect-outlook"
import { requireOrganizationContext } from "@/lib/auth/organization-context"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { getMessagingManager } from "@/lib/domain/messaging/messaging.manager"
import { isExtensionActive } from "@/lib/extensions"

export default async function IntegrationsSettingsPage() {
  const { organizationId } = await requireOrganizationContext()
  const plan = await getOrganizationPlan(organizationId)
  const messagingActive = await isExtensionActive(
    "messaging.msgraph",
    plan,
    organizationId
  )

  let connectionStatus = "disconnected"
  if (messagingActive) {
    try {
      const connection =
        await getMessagingManager().getConnection(organizationId)
      connectionStatus = connection.status
    } catch {
      connectionStatus = "disconnected"
    }
  }

  if (!messagingActive) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-sm font-medium">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            No connection-based integrations are active for this organization.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-medium">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect providers for extensions already active for your organization.
        </p>
      </div>

      <ul className="divide-y divide-border border">
        <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Microsoft Outlook</span>
            <span className="font-mono text-xs text-muted-foreground">
              messaging.msgraph
            </span>
          </div>
          <ConnectOutlook initialStatus={connectionStatus} />
        </li>
      </ul>
    </div>
  )
}

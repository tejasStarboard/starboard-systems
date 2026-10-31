import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { ConnectOutlook } from "@/components/messaging/connect-outlook"
import { auth } from "@/lib/auth"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { getMessagingManager } from "@/lib/domain/messaging/messaging.manager"
import { isExtensionActive, listRegisteredExtensions } from "@/lib/extensions"

export default async function IntegrationsSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.session.activeOrganizationId) {
    redirect("/login")
  }

  const organizationId = session.session.activeOrganizationId
  const plan = await getOrganizationPlan(organizationId)
  const extensions = listRegisteredExtensions()
  const messagingActive = isExtensionActive("messaging.msgraph", plan)

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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-medium">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Registered extensions. Disabled extensions stay listed here but do not
          contribute nav or UI slots.
        </p>
      </div>

      <ul className="divide-y divide-border border">
        {extensions.map((extension) => (
          <li
            key={extension.id}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {extension.displayName}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {extension.id}
              </span>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Plan: {extension.requiredPlan.join(", ")}</span>
                <span>{extension.enabled ? "Enabled" : "Disabled"}</span>
              </div>
              {extension.id === "messaging.msgraph" && messagingActive ? (
                <ConnectOutlook initialStatus={connectionStatus} />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

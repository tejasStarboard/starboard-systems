import { redirect } from "next/navigation"

import { InboxPanel } from "@/components/messaging/inbox-panel"
import { requireOrganizationContext } from "@/lib/auth/organization-context"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { getMessagingManager } from "@/lib/domain/messaging/messaging.manager"
import { listActiveUiSlots } from "@/lib/extensions"

export default async function MessagingInboxPage() {
  const { organizationId } = await requireOrganizationContext()
  const plan = await getOrganizationPlan(organizationId)
  const slots = await listActiveUiSlots(plan, organizationId)
  if (!slots.includes("messaging.inbox")) {
    redirect("/")
  }

  let messages: Array<{
    id: string
    subject: string
    fromAddress: string
    bodyPreview: string
  }> = []
  try {
    messages = await getMessagingManager().listMessages(organizationId)
  } catch {
    messages = []
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-medium">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Microsoft Graph messages for this organization. Sync runs
          asynchronously via Temporal.
        </p>
      </div>
      <InboxPanel initialMessages={messages} />
    </div>
  )
}

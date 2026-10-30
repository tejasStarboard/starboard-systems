import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getOrganizationPlan } from "@/lib/billing/plan"

const PLAN_LABELS = {
  credit: "Credit",
  enterprise: "Enterprise",
} as const

export default async function BillingSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    redirect("/select-org")
  }

  const plan = await getOrganizationPlan(organizationId)

  return (
    <div className="p-6">
      <h1 className="text-sm font-medium">Billing</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Current plan:{" "}
        <span className="font-medium text-foreground">{PLAN_LABELS[plan]}</span>
      </p>
    </div>
  )
}

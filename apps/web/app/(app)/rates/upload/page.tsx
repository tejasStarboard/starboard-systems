import { redirect } from "next/navigation"

import { RatesUploadForm } from "@/components/rates/rates-upload-form"
import { requireOrganizationContext } from "@/lib/auth/organization-context"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { listActiveUiSlots } from "@/lib/extensions"

export default async function RatesUploadPage() {
  const { organizationId } = await requireOrganizationContext()
  const plan = await getOrganizationPlan(organizationId)
  const slots = await listActiveUiSlots(plan, organizationId)
  if (!slots.includes("rates.upload")) {
    redirect("/")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-medium">Rate upload</h1>
        <p className="text-sm text-muted-foreground">
          Upload an ocean FCL CSV sheet. Ingestion runs asynchronously via
          Temporal; failed gates do not save rates.
        </p>
      </div>
      <RatesUploadForm />
    </div>
  )
}

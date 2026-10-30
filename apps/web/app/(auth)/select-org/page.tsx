import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { SelectOrgForm } from "@/components/auth/select-org-form"
import { auth } from "@/lib/auth"

export default async function SelectOrgPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  return <SelectOrgForm />
}

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { auth } from "@/lib/auth"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { listActiveExtensionNav } from "@/lib/extensions"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
  const extensionNav = listActiveExtensionNav(plan)

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      extensionNav={extensionNav}
    >
      {children}
    </AppShell>
  )
}

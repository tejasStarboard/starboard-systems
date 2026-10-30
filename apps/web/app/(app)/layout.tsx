import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { auth } from "@/lib/auth"
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

  if (!session.session.activeOrganizationId) {
    redirect("/select-org")
  }

  const extensionNav = listActiveExtensionNav()

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

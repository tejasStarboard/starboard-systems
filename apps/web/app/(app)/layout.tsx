import { AppShell } from "@/components/app-shell"
import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { requireOrganizationContext } from "@/lib/auth/organization-context"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { getPlatformManager } from "@/lib/domain/platform/platform.manager"
import { listActiveExtensionNav } from "@/lib/extensions"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, organizationId, impersonation, isStaff } =
    await requireOrganizationContext()

  const plan = await getOrganizationPlan(organizationId)
  const extensionNav = await listActiveExtensionNav(plan, organizationId)

  let impersonatedOrgName: string | null = null
  if (impersonation) {
    const org = await getPlatformManager().getOrganizationById(
      impersonation.organizationId
    )
    impersonatedOrgName = org?.name ?? impersonation.organizationId
  }

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      extensionNav={extensionNav}
      showAdminNav={isStaff}
      impersonationBanner={
        impersonation ? (
          <ImpersonationBanner organizationName={impersonatedOrgName!} />
        ) : null
      }
    >
      {children}
    </AppShell>
  )
}

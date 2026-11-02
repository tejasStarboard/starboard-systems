import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { WorkbenchShell } from "@/components/workbench/workbench-shell"
import { env } from "@/env"
import { requireOrganizationContext } from "@/lib/auth/organization-context"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { getPlatformManager } from "@/lib/domain/platform/platform.manager"
import {
  listActiveExtensionNav,
  listActiveWorkbenchContributions,
} from "@/lib/extensions"
import {
  isKernelOnlyFlag,
  resolveWorkbenchContributions,
} from "@/lib/workbench/contributions"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, organizationId, impersonation, isStaff } =
    await requireOrganizationContext()

  const kernelOnly = isKernelOnlyFlag(env.WORKBENCH_KERNEL_ONLY)
  const plan = await getOrganizationPlan(organizationId)
  const extensionNav = kernelOnly
    ? []
    : await listActiveExtensionNav(plan, organizationId)
  const hostContributions = kernelOnly
    ? undefined
    : await listActiveWorkbenchContributions(plan, organizationId)
  const contributions = resolveWorkbenchContributions({
    kernelOnly,
    extensionNav,
    hostContributions,
  })

  let impersonatedOrgName: string | null = null
  if (impersonation) {
    const org = await getPlatformManager().getOrganizationById(
      impersonation.organizationId
    )
    impersonatedOrgName = org?.name ?? impersonation.organizationId
  }

  return (
    <WorkbenchShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      contributions={contributions}
      showAdminNav={isStaff}
      impersonationBanner={
        impersonation ? (
          <ImpersonationBanner organizationName={impersonatedOrgName!} />
        ) : null
      }
    >
      {/* Kernel-only lab: never mount product route content. */}
      {kernelOnly ? null : children}
    </WorkbenchShell>
  )
}

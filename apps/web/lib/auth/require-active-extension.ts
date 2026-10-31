import "server-only"

import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { isExtensionActive } from "@/lib/extensions"

export async function requireActiveExtension(extensionId: string) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return { error: authResult.error }
  }

  const { organizationId } = authResult
  const plan = await getOrganizationPlan(organizationId)
  if (!(await isExtensionActive(extensionId, plan, organizationId))) {
    return {
      error: NextResponse.json(
        { error: `Extension ${extensionId} is not enabled` },
        { status: 404 }
      ),
    }
  }

  return { organizationId, session: authResult.session }
}

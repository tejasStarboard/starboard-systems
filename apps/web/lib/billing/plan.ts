import "server-only"

import { organization } from "@starboard/lib-db/schema"
import { parsePlan, type Plan } from "@starboard/ext-host"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"

/** Resolve the active organization's billing plan (default credit). */
export async function getOrganizationPlan(
  organizationId: string
): Promise<Plan> {
  const [row] = await db
    .select({ plan: organization.plan })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1)

  return parsePlan(row?.plan)
}

import "server-only"

import { and, eq, inArray } from "drizzle-orm"
import { member, user } from "@starboard/db/schema"

import { db } from "@/lib/db"

export async function getUserNamesByIds(
  ids: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) {
    return new Map()
  }

  const rows = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(inArray(user.id, unique))

  return new Map(rows.map((row) => [row.id, row.name]))
}

/** Optional helper: orgs the user belongs to (for future scoping). */
export async function listMembershipOrganizationIds(userId: string) {
  const rows = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId))

  return rows.map((row) => row.organizationId)
}

export async function isUserMemberOfOrganization(
  userId: string,
  organizationId: string
) {
  const [row] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(eq(member.userId, userId), eq(member.organizationId, organizationId))
    )
    .limit(1)

  return Boolean(row)
}

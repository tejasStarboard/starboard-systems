import "server-only"

import { and, eq, inArray } from "drizzle-orm"
import { member, organization, user } from "@starboard/lib-db/schema"

import { db } from "@/lib/db"

export class OrganizationsDao {
  async getUserNamesByIds(ids: string[]): Promise<Map<string, string>> {
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

  /** Raw Better Auth `organization.metadata` (JSON text) or null. */
  async getOrganizationMetadata(
    organizationId: string
  ): Promise<string | null> {
    const [row] = await db
      .select({ metadata: organization.metadata })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1)
    return row?.metadata ?? null
  }

  /** Optional helper: orgs the user belongs to (for future scoping). */
  async listMembershipOrganizationIds(userId: string) {
    const rows = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, userId))

    return rows.map((row) => row.organizationId)
  }

  async isUserMemberOfOrganization(userId: string, organizationId: string) {
    const [row] = await db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, userId),
          eq(member.organizationId, organizationId)
        )
      )
      .limit(1)

    return Boolean(row)
  }
}

let organizationsDao: OrganizationsDao = new OrganizationsDao()

export function getOrganizationsDao(): OrganizationsDao {
  return organizationsDao
}

export function setOrganizationsDao(dao: OrganizationsDao) {
  organizationsDao = dao
}

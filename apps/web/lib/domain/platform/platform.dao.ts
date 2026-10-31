import "server-only"

import { eq, ilike, inArray, or } from "drizzle-orm"
import {
  extensionRollout,
  extensionRolloutOrg,
  extensionSetting,
  organization,
  platformAuditLog,
  platformCommonBetaOrg,
} from "@starboard/lib-db/schema"
import {
  parseRolloutMode,
  type ExtensionRolloutState,
  type RolloutMode,
} from "@starboard/ext-host"

import { db } from "@/lib/db"

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`
}

export type ExtensionSettingRow = {
  extensionId: string
  key: string
  value: unknown
}

export type OrganizationSummary = {
  id: string
  name: string
  slug: string
  plan: string
}

export class PlatformDao {
  async getCommonBetaOrganizationIds(): Promise<string[]> {
    const rows = await db
      .select({ organizationId: platformCommonBetaOrg.organizationId })
      .from(platformCommonBetaOrg)
    return rows.map((row) => row.organizationId)
  }

  async getCommonBetaOrganizations(): Promise<OrganizationSummary[]> {
    const rows = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
      })
      .from(platformCommonBetaOrg)
      .innerJoin(
        organization,
        eq(platformCommonBetaOrg.organizationId, organization.id)
      )
      .orderBy(organization.name)
    return rows
  }

  async setCommonBetaOrganizations(input: {
    organizationIds: string[]
    actorUserId: string
  }) {
    const uniqueIds = [...new Set(input.organizationIds.filter(Boolean))]

    await db.delete(platformCommonBetaOrg)

    if (uniqueIds.length > 0) {
      await db.insert(platformCommonBetaOrg).values(
        uniqueIds.map((organizationId) => ({
          organizationId,
          updatedByUserId: input.actorUserId,
        }))
      )
    }

    await this.appendAudit({
      actorUserId: input.actorUserId,
      action: "common_beta.set",
      detail: JSON.stringify({ organizationIds: uniqueIds }),
    })
  }

  async getRolloutMap(): Promise<Map<string, ExtensionRolloutState>> {
    const rows = await db.select().from(extensionRollout)
    const orgRows = await db.select().from(extensionRolloutOrg)
    const commonIds = await this.getCommonBetaOrganizationIds()

    const orgsByExtension = new Map<string, string[]>()
    for (const row of orgRows) {
      const list = orgsByExtension.get(row.extensionId) ?? []
      list.push(row.organizationId)
      orgsByExtension.set(row.extensionId, list)
    }

    const map = new Map<string, ExtensionRolloutState>()
    for (const row of rows) {
      const mode = parseRolloutMode(row.mode)
      map.set(row.extensionId, {
        mode,
        organizationIds:
          mode === "common"
            ? commonIds
            : (orgsByExtension.get(row.extensionId) ?? []),
      })
    }
    return map
  }

  async setRollout(input: {
    extensionId: string
    mode: RolloutMode
    organizationIds: string[]
    actorUserId: string
  }) {
    const { extensionId, mode, organizationIds, actorUserId } = input

    await db
      .insert(extensionRollout)
      .values({
        extensionId,
        mode,
        updatedByUserId: actorUserId,
      })
      .onConflictDoUpdate({
        target: extensionRollout.extensionId,
        set: {
          mode,
          updatedByUserId: actorUserId,
          updatedAt: new Date(),
        },
      })

    await db
      .delete(extensionRolloutOrg)
      .where(eq(extensionRolloutOrg.extensionId, extensionId))

    if (mode === "beta" && organizationIds.length > 0) {
      await db.insert(extensionRolloutOrg).values(
        organizationIds.map((organizationId) => ({
          extensionId,
          organizationId,
        }))
      )
    }

    await this.appendAudit({
      actorUserId,
      action: "rollout.set",
      extensionId,
      detail: JSON.stringify({ mode, organizationIds }),
    })
  }

  async listExtensionSettings(
    extensionId?: string
  ): Promise<ExtensionSettingRow[]> {
    const query = db
      .select({
        extensionId: extensionSetting.extensionId,
        key: extensionSetting.key,
        value: extensionSetting.value,
      })
      .from(extensionSetting)

    if (!extensionId) {
      return query
    }

    return query.where(eq(extensionSetting.extensionId, extensionId))
  }

  async upsertExtensionSettings(input: {
    extensionId: string
    entries: Array<{ key: string; value: unknown }>
    actorUserId: string
  }) {
    if (input.entries.length === 0) {
      return
    }

    for (const entry of input.entries) {
      await db
        .insert(extensionSetting)
        .values({
          extensionId: input.extensionId,
          key: entry.key,
          value: entry.value,
          updatedByUserId: input.actorUserId,
        })
        .onConflictDoUpdate({
          target: [extensionSetting.extensionId, extensionSetting.key],
          set: {
            value: entry.value,
            updatedByUserId: input.actorUserId,
            updatedAt: new Date(),
          },
        })
    }

    await this.appendAudit({
      actorUserId: input.actorUserId,
      action: "extension_setting.update",
      extensionId: input.extensionId,
      detail: JSON.stringify({
        keys: input.entries.map((entry) => entry.key),
      }),
    })
  }

  async searchOrganizations(query: string, limit = 25) {
    const trimmed = query.trim()
    if (!trimmed) {
      return db
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan,
        })
        .from(organization)
        .orderBy(organization.name)
        .limit(limit)
    }

    const pattern = `%${trimmed}%`
    return db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
      })
      .from(organization)
      .where(
        or(
          ilike(organization.name, pattern),
          ilike(organization.slug, pattern),
          eq(organization.id, trimmed)
        )
      )
      .orderBy(organization.name)
      .limit(limit)
  }

  async getOrganizationsByIds(
    organizationIds: string[]
  ): Promise<OrganizationSummary[]> {
    const unique = [...new Set(organizationIds.filter(Boolean))]
    if (unique.length === 0) {
      return []
    }

    return db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
      })
      .from(organization)
      .where(inArray(organization.id, unique))
      .orderBy(organization.name)
  }

  async getOrganizationById(organizationId: string) {
    const [row] = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
      })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1)
    return row ?? null
  }

  async appendAudit(input: {
    actorUserId: string
    action: string
    organizationId?: string | null
    extensionId?: string | null
    detail?: string | null
  }) {
    await db.insert(platformAuditLog).values({
      id: newId("aud"),
      actorUserId: input.actorUserId,
      action: input.action,
      organizationId: input.organizationId ?? null,
      extensionId: input.extensionId ?? null,
      detail: input.detail ?? null,
    })
  }
}

let platformDao: PlatformDao = new PlatformDao()

export function getPlatformDao(): PlatformDao {
  return platformDao
}

export function setPlatformDao(dao: PlatformDao) {
  platformDao = dao
}

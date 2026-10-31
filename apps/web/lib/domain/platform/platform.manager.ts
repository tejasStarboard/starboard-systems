import "server-only"

import {
  getDeclaredSettings,
  listManifests,
  resolveExtensionSettingValues,
  resolveStaffSettings,
  validateSettingValues,
  type ExtensionRolloutState,
  type RolloutMode,
  type StaffSettingView,
} from "@starboard/ext-host"

import {
  clearImpersonationCookie,
  setImpersonationCookie,
} from "@/lib/auth/impersonation"
import {
  getPlatformDao,
  type OrganizationSummary,
  type PlatformDao,
} from "@/lib/domain/platform/platform.dao"

export class ExtensionSettingsError extends Error {
  readonly status: 400 | 404

  constructor(message: string, status: 400 | 404) {
    super(message)
    this.name = "ExtensionSettingsError"
    this.status = status
  }
}

export type StaffExtensionSettings = {
  extensionId: string
  displayName: string
  settings: StaffSettingView[]
}

export class PlatformManager {
  constructor(private readonly dao: PlatformDao = getPlatformDao()) {}

  getRolloutMap(): Promise<Map<string, ExtensionRolloutState>> {
    return this.dao.getRolloutMap()
  }

  setRollout(input: {
    extensionId: string
    mode: RolloutMode
    organizationIds: string[]
    actorUserId: string
  }) {
    return this.dao.setRollout(input)
  }

  getCommonBetaOrganizations(): Promise<OrganizationSummary[]> {
    return this.dao.getCommonBetaOrganizations()
  }

  setCommonBetaOrganizations(input: {
    organizationIds: string[]
    actorUserId: string
  }) {
    return this.dao.setCommonBetaOrganizations(input)
  }

  searchOrganizations(query: string) {
    return this.dao.searchOrganizations(query)
  }

  getOrganizationsByIds(organizationIds: string[]) {
    return this.dao.getOrganizationsByIds(organizationIds)
  }

  getOrganizationById(organizationId: string) {
    return this.dao.getOrganizationById(organizationId)
  }

  async listStaffExtensionSettings(): Promise<StaffExtensionSettings[]> {
    const stored = await this.dao.listExtensionSettings()
    return listManifests().map((manifest) => ({
      extensionId: manifest.id,
      displayName: manifest.displayName,
      settings: resolveStaffSettings(
        getDeclaredSettings(manifest),
        stored.filter((row) => row.extensionId === manifest.id)
      ),
    }))
  }

  async setExtensionSettings(input: {
    extensionId: string
    values: Record<string, unknown>
    actorUserId: string
  }): Promise<StaffSettingView[]> {
    const manifest = listManifests().find(
      (item) => item.id === input.extensionId
    )
    if (!manifest) {
      throw new ExtensionSettingsError("Unknown extension", 404)
    }

    const declarations = getDeclaredSettings(manifest)
    const parsed = validateSettingValues(declarations, input.values)
    if (!parsed.ok) {
      throw new ExtensionSettingsError(parsed.message, 400)
    }

    await this.dao.upsertExtensionSettings({
      extensionId: input.extensionId,
      entries: parsed.entries,
      actorUserId: input.actorUserId,
    })

    const stored = await this.dao.listExtensionSettings(input.extensionId)
    return resolveStaffSettings(declarations, stored)
  }

  async getExtensionSettings(
    extensionId: string
  ): Promise<Record<string, boolean | string | number | null>> {
    const manifest = listManifests().find((item) => item.id === extensionId)
    if (!manifest) {
      return {}
    }

    const stored = await this.dao.listExtensionSettings(extensionId)
    return resolveExtensionSettingValues(getDeclaredSettings(manifest), stored)
  }

  async startImpersonation(input: {
    actorUserId: string
    organizationId: string
  }) {
    const org = await this.dao.getOrganizationById(input.organizationId)
    if (!org) {
      throw new Error("Organization not found")
    }
    await setImpersonationCookie({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
    })
    await this.dao.appendAudit({
      actorUserId: input.actorUserId,
      action: "impersonation.start",
      organizationId: input.organizationId,
      detail: JSON.stringify({ organizationName: org.name }),
    })
    return org
  }

  async endImpersonation(input: {
    actorUserId: string
    organizationId?: string | null
  }) {
    await clearImpersonationCookie()
    await this.dao.appendAudit({
      actorUserId: input.actorUserId,
      action: "impersonation.end",
      organizationId: input.organizationId ?? null,
    })
  }
}

let platformManager: PlatformManager = new PlatformManager()

export function getPlatformManager(): PlatformManager {
  return platformManager
}

export function setPlatformManager(manager: PlatformManager) {
  platformManager = manager
}

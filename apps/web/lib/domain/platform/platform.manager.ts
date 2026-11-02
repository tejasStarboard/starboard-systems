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

import { env } from "@/env"
import {
  clearImpersonationCookie,
  setImpersonationCookie,
} from "@/lib/auth/impersonation"
import {
  isCarrierExtensionId,
  materializeSettingRows,
  missingRequiredSecrets,
  openSecretValues,
  organizationScopedSettings,
  sealSettingEntries,
} from "@/lib/domain/platform/carrier-credentials"
import {
  getPlatformDao,
  type CredentialCheckRow,
  type OrganizationSummary,
  type PlatformDao,
} from "@/lib/domain/platform/platform.dao"
import { getSpotClient } from "@/lib/domain/spot/spot.client"
import { ServiceClientError } from "@/lib/clients/http"

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

export type CarrierCredentialValidation = {
  status: "ok" | "error" | null
  validatedAt: string | null
  errorMessage: string | null
}

export type OrgCarrierCredentials = {
  extensionId: string
  displayName: string
  settings: StaffSettingView[]
  validation: CarrierCredentialValidation
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
        getDeclaredSettings(manifest).filter(
          (setting) => setting.scope === "platform"
        ),
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

    const declarations = getDeclaredSettings(manifest).filter(
      (setting) => setting.scope === "platform"
    )
    const parsed = validateSettingValues(declarations, input.values)
    if (!parsed.ok) {
      throw new ExtensionSettingsError(parsed.message, 400)
    }

    await this.dao.upsertExtensionSettings({
      extensionId: input.extensionId,
      entries: sealSettingEntries(
        declarations,
        parsed.entries,
        env.EXTENSION_SETTINGS_SECRET
      ),
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

    const declarations = getDeclaredSettings(manifest).filter(
      (setting) => setting.scope === "platform"
    )
    const stored = await this.dao.listExtensionSettings(extensionId)
    return resolveExtensionSettingValues(
      declarations,
      materializeSettingRows(
        declarations,
        stored,
        env.EXTENSION_SETTINGS_SECRET
      )
    )
  }

  async listOrgCarrierCredentials(
    organizationId: string
  ): Promise<OrgCarrierCredentials[]> {
    const manifests = listManifests().filter((manifest) =>
      isCarrierExtensionId(manifest.id)
    )
    const carriers: OrgCarrierCredentials[] = []
    for (const manifest of manifests) {
      carriers.push(
        await this.orgCarrierView(
          organizationId,
          manifest.id,
          manifest.displayName
        )
      )
    }
    return carriers
  }

  async saveOrgCarrierCredentials(input: {
    organizationId: string
    extensionId: string
    values: Record<string, unknown>
    actorUserId: string
  }): Promise<OrgCarrierCredentials> {
    const manifest = this.requireCarrier(input.extensionId)
    const declarations = organizationScopedSettings(
      getDeclaredSettings(manifest)
    )
    const stored = await this.dao.listExtensionSettings(
      input.extensionId,
      input.organizationId
    )
    const missing = missingRequiredSecrets(
      declarations,
      new Set(stored.map((row) => row.key)),
      input.values
    )
    if (missing) {
      throw new ExtensionSettingsError(missing, 400)
    }

    const parsed = validateSettingValues(declarations, input.values)
    if (!parsed.ok) {
      throw new ExtensionSettingsError(parsed.message, 400)
    }

    if (parsed.entries.length > 0) {
      await this.dao.upsertExtensionSettings({
        extensionId: input.extensionId,
        organizationId: input.organizationId,
        entries: sealSettingEntries(
          declarations,
          parsed.entries,
          env.EXTENSION_SETTINGS_SECRET
        ),
        actorUserId: input.actorUserId,
      })
    }

    return this.validateOrgCarrierCredentials({
      organizationId: input.organizationId,
      extensionId: input.extensionId,
    })
  }

  async validateOrgCarrierCredentials(input: {
    organizationId: string
    extensionId: string
  }): Promise<OrgCarrierCredentials> {
    const manifest = this.requireCarrier(input.extensionId)
    const declarations = organizationScopedSettings(
      getDeclaredSettings(manifest)
    )
    const stored = await this.dao.listExtensionSettings(
      input.extensionId,
      input.organizationId
    )
    const credentials = openSecretValues(
      declarations,
      stored,
      env.EXTENSION_SETTINGS_SECRET
    )

    let status: "ok" | "error" = "error"
    let errorMessage: string | null = "Validation failed"
    if (Object.keys(credentials).length === 0) {
      errorMessage = "missing_credentials"
    } else {
      try {
        const result = await getSpotClient().validateCredentials(
          input.extensionId,
          input.organizationId,
          credentials
        )
        if (result.ok) {
          status = "ok"
          errorMessage = null
        } else {
          errorMessage = "Validation failed"
        }
      } catch (error) {
        if (error instanceof ServiceClientError) {
          errorMessage = "Carrier validation is unavailable"
        }
      }
    }

    await this.dao.upsertCredentialCheck({
      organizationId: input.organizationId,
      extensionId: input.extensionId,
      status,
      errorMessage,
      validatedAt: new Date(),
    })

    return this.orgCarrierView(
      input.organizationId,
      manifest.id,
      manifest.displayName
    )
  }

  async getDecryptedCarrierCredentials(
    organizationId: string,
    extensionId: string
  ): Promise<Record<string, string> | null> {
    if (!isCarrierExtensionId(extensionId)) {
      throw new ExtensionSettingsError("Unknown extension", 404)
    }
    const manifest = listManifests().find((item) => item.id === extensionId)
    if (!manifest) {
      throw new ExtensionSettingsError("Unknown extension", 404)
    }
    const declarations = organizationScopedSettings(
      getDeclaredSettings(manifest)
    )
    const stored = await this.dao.listExtensionSettings(
      extensionId,
      organizationId
    )
    const credentials = openSecretValues(
      declarations,
      stored,
      env.EXTENSION_SETTINGS_SECRET
    )
    return Object.keys(credentials).length > 0 ? credentials : null
  }

  private requireCarrier(extensionId: string) {
    if (!isCarrierExtensionId(extensionId)) {
      throw new ExtensionSettingsError("Unknown extension", 404)
    }
    const manifest = listManifests().find((item) => item.id === extensionId)
    if (!manifest) {
      throw new ExtensionSettingsError("Unknown extension", 404)
    }
    return manifest
  }

  private async orgCarrierView(
    organizationId: string,
    extensionId: string,
    displayName: string
  ): Promise<OrgCarrierCredentials> {
    const manifest = listManifests().find((item) => item.id === extensionId)
    const declarations = organizationScopedSettings(
      manifest ? getDeclaredSettings(manifest) : []
    )
    const stored = await this.dao.listExtensionSettings(
      extensionId,
      organizationId
    )
    const check = await this.dao.getCredentialCheck(organizationId, extensionId)
    return {
      extensionId,
      displayName,
      settings: resolveStaffSettings(declarations, stored),
      validation: toValidation(check),
    }
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

function toValidation(
  check: CredentialCheckRow | null
): CarrierCredentialValidation {
  if (!check) {
    return { status: null, validatedAt: null, errorMessage: null }
  }
  return {
    status: check.status,
    validatedAt: check.validatedAt ? check.validatedAt.toISOString() : null,
    errorMessage: check.errorMessage,
  }
}

let platformManager: PlatformManager = new PlatformManager()

export function getPlatformManager(): PlatformManager {
  return platformManager
}

export function setPlatformManager(manager: PlatformManager) {
  platformManager = manager
}

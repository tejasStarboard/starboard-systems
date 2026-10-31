import "server-only"

import type { ExtensionRolloutState, RolloutMode } from "@starboard/ext-host"

import {
  clearImpersonationCookie,
  setImpersonationCookie,
} from "@/lib/auth/impersonation"
import {
  getPlatformDao,
  type OrganizationSummary,
  type PlatformDao,
} from "@/lib/domain/platform/platform.dao"

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

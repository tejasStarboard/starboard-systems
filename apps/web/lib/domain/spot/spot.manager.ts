import "server-only"

import type { ExtensionJobStatusResult } from "@/lib/domain/extension-job"
import { spotJobSettingsFromResolved } from "@/lib/domain/platform/extension-settings-runtime"
import { getPlatformManager } from "@/lib/domain/platform/platform.manager"
import {
  getSpotClient,
  type EnqueueSpotSearchResult,
  type SpotClient,
  type SpotSearchInput,
} from "@/lib/domain/spot/spot.client"

export class SpotManager {
  constructor(private readonly spotClient: SpotClient = getSpotClient()) {}

  async enqueueSearch(
    extensionId: string,
    input: SpotSearchInput
  ): Promise<EnqueueSpotSearchResult> {
    const resolved =
      await getPlatformManager().getExtensionSettings(extensionId)
    const fromSettings = spotJobSettingsFromResolved(extensionId, resolved)

    return this.spotClient.enqueueSearch(extensionId, {
      ...input,
      ...fromSettings,
    })
  }

  enqueueFakeSearch(input: SpotSearchInput): Promise<EnqueueSpotSearchResult> {
    return this.spotClient.enqueueFakeSearch(input)
  }

  getJobStatus(
    extensionId: string,
    workflowId: string,
    organizationId: string
  ): Promise<ExtensionJobStatusResult> {
    return this.spotClient.getJobStatus(extensionId, workflowId, organizationId)
  }
}

let spotManager: SpotManager = new SpotManager()

export function getSpotManager(): SpotManager {
  return spotManager
}

export function setSpotManager(manager: SpotManager) {
  spotManager = manager
}

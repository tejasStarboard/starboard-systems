import "server-only"

import {
  getSpotClient,
  type EnqueueSpotSearchResult,
  type SpotClient,
  type SpotSearchInput,
} from "@/lib/domain/spot/spot.client"

export class SpotManager {
  constructor(private readonly spotClient: SpotClient = getSpotClient()) {}

  enqueueFakeSearch(input: SpotSearchInput): Promise<EnqueueSpotSearchResult> {
    return this.spotClient.enqueueFakeSearch(input)
  }
}

let spotManager: SpotManager = new SpotManager()

export function getSpotManager(): SpotManager {
  return spotManager
}

export function setSpotManager(manager: SpotManager) {
  spotManager = manager
}

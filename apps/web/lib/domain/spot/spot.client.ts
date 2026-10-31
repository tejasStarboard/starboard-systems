import "server-only"

import { env } from "@/env"
import {
  createServiceOptions,
  parseJsonResponse,
  serviceFetch,
  ServiceClientError,
} from "@/lib/clients/http"

export type EnqueueSpotSearchResult = {
  workflowId: string
  runId: string
}

export type SpotSearchInput = {
  organizationId: string
  origin?: string
  destination?: string
  mode?: string
}

function isSpotExtensionId(
  extensionId: string
): extensionId is "spot.fake" | "spot.maersk" | "spot.cma" {
  return (
    extensionId === "spot.fake" ||
    extensionId === "spot.maersk" ||
    extensionId === "spot.cma"
  )
}

export interface SpotClient {
  enqueueSearch(
    extensionId: string,
    input: SpotSearchInput
  ): Promise<EnqueueSpotSearchResult>
  enqueueFakeSearch(input: SpotSearchInput): Promise<EnqueueSpotSearchResult>
}

class HttpSpotClient implements SpotClient {
  constructor(
    private readonly options: { baseUrl: string } = {
      baseUrl: env.SPOT_SERVICE_URL,
    }
  ) {}

  async enqueueSearch(
    extensionId: string,
    input: SpotSearchInput
  ): Promise<EnqueueSpotSearchResult> {
    if (!isSpotExtensionId(extensionId)) {
      throw new ServiceClientError(
        `Unsupported spot extension: ${extensionId}`,
        400,
        "local"
      )
    }
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId: input.organizationId,
    })
    const response = await serviceFetch(
      `/extensions/${extensionId}/jobs`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: input.organizationId,
          origin: input.origin,
          destination: input.destination,
          mode: input.mode ?? "fcl",
        }),
      },
      options
    )
    const body = await parseJsonResponse<{
      workflowId?: string
      runId?: string
    }>(response, "Failed to enqueue spot search")
    if (!body.workflowId || !body.runId) {
      throw new ServiceClientError(
        "Failed to enqueue spot search: invalid response",
        502,
        options.requestId
      )
    }
    return { workflowId: body.workflowId, runId: body.runId }
  }

  enqueueFakeSearch(input: SpotSearchInput): Promise<EnqueueSpotSearchResult> {
    return this.enqueueSearch("spot.fake", input)
  }
}

let spotClient: SpotClient = new HttpSpotClient()

export function getSpotClient(): SpotClient {
  return spotClient
}

export function setSpotClient(client: SpotClient) {
  spotClient = client
}

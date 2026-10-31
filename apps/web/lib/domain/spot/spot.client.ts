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

export interface SpotClient {
  enqueueFakeSearch(input: SpotSearchInput): Promise<EnqueueSpotSearchResult>
}

class HttpSpotClient implements SpotClient {
  constructor(
    private readonly options: { baseUrl: string } = {
      baseUrl: env.SPOT_SERVICE_URL,
    }
  ) {}

  async enqueueFakeSearch(
    input: SpotSearchInput
  ): Promise<EnqueueSpotSearchResult> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId: input.organizationId,
    })
    const response = await serviceFetch(
      "/extensions/spot.fake/jobs",
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
}

let spotClient: SpotClient = new HttpSpotClient()

export function getSpotClient(): SpotClient {
  return spotClient
}

export function setSpotClient(client: SpotClient) {
  spotClient = client
}

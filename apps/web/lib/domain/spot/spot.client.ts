import "server-only"

import { listManifests } from "@starboard/ext-host"

import { env } from "@/env"
import {
  createServiceOptions,
  parseJsonResponse,
  serviceFetch,
  ServiceClientError,
} from "@/lib/clients/http"
import type { ExtensionJobStatusResult } from "@/lib/domain/extension-job"

export type EnqueueSpotSearchResult = {
  workflowId: string
  runId: string
}

export type SpotSearchInput = {
  organizationId: string
  origin?: string
  destination?: string
  mode?: string
  /** From admin `live_strategy` setting (spot.maersk / spot.cma). */
  liveStrategy?: boolean
}

function assertSpotExtension(extensionId: string) {
  const manifest = listManifests().find((item) => item.id === extensionId)
  if (manifest?.worker?.service !== "spot") {
    throw new ServiceClientError(
      `Unsupported spot extension: ${extensionId}`,
      400,
      "local"
    )
  }
}

export interface SpotClient {
  enqueueSearch(
    extensionId: string,
    input: SpotSearchInput
  ): Promise<EnqueueSpotSearchResult>
  enqueueFakeSearch(input: SpotSearchInput): Promise<EnqueueSpotSearchResult>
  getJobStatus(
    extensionId: string,
    workflowId: string,
    organizationId: string
  ): Promise<ExtensionJobStatusResult>
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
    assertSpotExtension(extensionId)
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
          ...(typeof input.liveStrategy === "boolean"
            ? { liveStrategy: input.liveStrategy }
            : {}),
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

  async getJobStatus(
    extensionId: string,
    workflowId: string,
    organizationId: string
  ): Promise<ExtensionJobStatusResult> {
    assertSpotExtension(extensionId)
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
    })
    const response = await serviceFetch(
      `/extensions/${extensionId}/jobs/${encodeURIComponent(workflowId)}`,
      { method: "GET" },
      options
    )
    return parseJsonResponse(response, "Failed to load spot job status")
  }
}

let spotClient: SpotClient = new HttpSpotClient()

export function getSpotClient(): SpotClient {
  return spotClient
}

export function setSpotClient(client: SpotClient) {
  spotClient = client
}

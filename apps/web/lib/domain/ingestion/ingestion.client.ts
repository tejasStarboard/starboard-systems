import "server-only"

import { env } from "@/env"
import {
  createServiceOptions,
  parseJsonResponse,
  serviceFetch,
  ServiceClientError,
} from "@/lib/clients/http"
import type { ExtensionJobStatusResult } from "@/lib/domain/extension-job"

export type EnqueueIngestionJobResult = {
  workflowId: string
  runId: string
}

export interface IngestionClient {
  enqueueFclV6Job(
    organizationId: string,
    file: Blob,
    filename: string,
    requestId?: string
  ): Promise<EnqueueIngestionJobResult>
  getJobStatus(
    organizationId: string,
    workflowId: string,
    requestId?: string
  ): Promise<ExtensionJobStatusResult>
}

class HttpIngestionClient implements IngestionClient {
  constructor(
    private readonly options: { baseUrl: string } = {
      baseUrl: env.INGESTION_SERVICE_URL,
    }
  ) {}

  async enqueueFclV6Job(
    organizationId: string,
    file: Blob,
    filename: string,
    requestId?: string
  ): Promise<EnqueueIngestionJobResult> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })

    const form = new FormData()
    form.set("organizationId", organizationId)
    form.set("file", file, filename)

    const response = await serviceFetch(
      "/extensions/ingestion.fcl_v6/jobs",
      {
        method: "POST",
        body: form,
      },
      options
    )

    const body = await parseJsonResponse<{
      workflowId?: string
      runId?: string
    }>(response, "Failed to enqueue ingestion job")

    if (!body.workflowId || !body.runId) {
      throw new ServiceClientError(
        "Failed to enqueue ingestion job: invalid response",
        502,
        options.requestId
      )
    }

    return { workflowId: body.workflowId, runId: body.runId }
  }

  async getJobStatus(
    organizationId: string,
    workflowId: string,
    requestId?: string
  ): Promise<ExtensionJobStatusResult> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
      requestId,
    })
    const response = await serviceFetch(
      `/extensions/ingestion.fcl_v6/jobs/${encodeURIComponent(workflowId)}`,
      { method: "GET" },
      options
    )
    return parseJsonResponse(response, "Failed to load ingestion job status")
  }
}

let ingestionClient: IngestionClient = new HttpIngestionClient()

export function getIngestionClient(): IngestionClient {
  return ingestionClient
}

export function setIngestionClient(client: IngestionClient) {
  ingestionClient = client
}

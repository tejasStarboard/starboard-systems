import "server-only"

import { env } from "@/env"
import {
  createServiceOptions,
  parseJsonResponse,
  serviceFetch,
  ServiceClientError,
} from "@/lib/clients/http"

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
}

class HttpIngestionClient implements IngestionClient {
  async enqueueFclV6Job(
    organizationId: string,
    file: Blob,
    filename: string,
    requestId?: string
  ): Promise<EnqueueIngestionJobResult> {
    const options = createServiceOptions({
      baseUrl: env.INGESTION_SERVICE_URL,
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
}

export function getIngestionClient(): IngestionClient {
  return new HttpIngestionClient()
}

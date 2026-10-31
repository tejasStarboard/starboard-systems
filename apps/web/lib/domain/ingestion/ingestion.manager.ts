import "server-only"

import type { ExtensionJobStatusResult } from "@/lib/domain/extension-job"
import {
  getIngestionClient,
  type IngestionClient,
} from "@/lib/domain/ingestion/ingestion.client"

export class IngestionManager {
  constructor(
    private readonly ingestionClient: IngestionClient = getIngestionClient()
  ) {}

  async enqueueFclV6Upload(
    organizationId: string,
    file: File
  ): Promise<{ workflowId: string; runId: string }> {
    return this.ingestionClient.enqueueFclV6Job(
      organizationId,
      file,
      file.name || "sheet.csv"
    )
  }

  getJobStatus(
    organizationId: string,
    workflowId: string
  ): Promise<ExtensionJobStatusResult> {
    return this.ingestionClient.getJobStatus(organizationId, workflowId)
  }
}

let ingestionManager: IngestionManager = new IngestionManager()

export function getIngestionManager(): IngestionManager {
  return ingestionManager
}

export function setIngestionManager(manager: IngestionManager) {
  ingestionManager = manager
}

import "server-only"

import {
  getIngestionClient,
  type IngestionClient,
} from "@/lib/clients/ingestion-client"

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
}

let ingestionManager: IngestionManager = new IngestionManager()

export function getIngestionManager(): IngestionManager {
  return ingestionManager
}

export function setIngestionManager(manager: IngestionManager) {
  ingestionManager = manager
}

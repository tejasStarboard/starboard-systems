import "server-only"

import { getIngestionClient } from "@/lib/clients/ingestion-client"

export async function enqueueFclV6Upload(
  organizationId: string,
  file: File
): Promise<{ workflowId: string; runId: string }> {
  const client = getIngestionClient()
  return client.enqueueFclV6Job(organizationId, file, file.name || "sheet.csv")
}

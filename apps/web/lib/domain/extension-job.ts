export type ExtensionJobStatus =
  "running" | "completed" | "failed" | "cancelled"

export type ExtensionJobStatusResult = {
  status: ExtensionJobStatus
  result?: unknown
  error?: string
}

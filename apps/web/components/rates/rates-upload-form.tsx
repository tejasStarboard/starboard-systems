"use client"

import * as React from "react"
import { useState } from "react"

import { Button } from "@starboard/lib-ui/components/button"

import { extensionApiPath } from "@/lib/extension-api-path"
import {
  pollExtensionJob,
  type PolledJobStatus,
} from "@/lib/poll-extension-job"

const INGESTION_EXTENSION_ID = "ingestion.fcl_v6"

export function RatesUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<{ workflowId: string; runId: string } | null>(
    null
  )
  const [jobStatus, setJobStatus] = useState<PolledJobStatus | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!file) {
      setError("Choose a CSV file")
      return
    }
    setPending(true)
    setError(null)
    setJob(null)
    setJobStatus(null)
    try {
      const body = new FormData()
      body.set("file", file)
      const response = await fetch(
        extensionApiPath(INGESTION_EXTENSION_ID, "jobs"),
        {
          method: "POST",
          body,
        }
      )
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        workflowId?: string
        runId?: string
      } | null
      if (!response.ok) {
        setError(payload?.error ?? "Upload failed")
        return
      }
      if (!payload?.workflowId || !payload.runId) {
        setError("Unexpected response from ingestion")
        return
      }
      setJob({ workflowId: payload.workflowId, runId: payload.runId })
      setJobStatus({ status: "running" })
      const status = await pollExtensionJob({
        extensionId: INGESTION_EXTENSION_ID,
        workflowId: payload.workflowId,
      })
      setJobStatus(status)
      if (status.status === "failed" || status.status === "cancelled") {
        setError(status.error ?? `Ingestion ${status.status}`)
      }
    } catch {
      setError("Upload failed")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="text-sm"
      />
      <Button type="submit" disabled={pending || !file}>
        {pending ? "Working…" : "Enqueue ingestion"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {job ? (
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            Job {job.workflowId}
            {jobStatus ? ` — ${jobStatus.status}` : ""}
          </p>
          {jobStatus?.status === "completed" ? (
            <p className="font-mono">
              Result: {JSON.stringify(jobStatus.result ?? null)}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  )
}

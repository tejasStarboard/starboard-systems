"use client"

import * as React from "react"
import { useState } from "react"

import { Button } from "@starboard/lib-ui/components/button"

export function RatesUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<{ workflowId: string; runId: string } | null>(
    null
  )

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!file) {
      setError("Choose a CSV file")
      return
    }
    setPending(true)
    setError(null)
    setJob(null)
    try {
      const body = new FormData()
      body.set("file", file)
      const response = await fetch("/api/extensions/ingestion.fcl_v6/jobs", {
        method: "POST",
        body,
      })
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
        {pending ? "Uploading…" : "Enqueue ingestion"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {job ? (
        <p className="font-mono text-xs text-muted-foreground">
          Accepted 202 — workflowId={job.workflowId} runId={job.runId}
        </p>
      ) : null}
    </form>
  )
}

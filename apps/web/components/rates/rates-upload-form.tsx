"use client"

import * as React from "react"

import { Button } from "@starboard/lib-ui/components/button"

import { useRatesUpload } from "@/hooks/use-rates-upload"

export function RatesUploadForm() {
  const { file, setFile, pending, job, jobStatus, upload } = useRatesUpload()

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    void upload()
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <input
        type="file"
        accept=".csv,.xlsx,.pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="text-sm"
      />
      <Button type="submit" disabled={pending || !file}>
        {pending ? "Working…" : "Enqueue ingestion"}
      </Button>
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

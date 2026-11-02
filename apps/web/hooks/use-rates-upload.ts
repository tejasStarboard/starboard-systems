"use client"

import { useCallback, useState } from "react"

import { toast } from "@starboard/lib-ui/components/toast"

import { useExtensionJob } from "@/hooks/use-extension-job"

const INGESTION_EXTENSION_ID = "ingestion.fcl_v6"

export function useRatesUpload() {
  const [file, setFile] = useState<File | null>(null)
  const { pending, job, jobStatus, enqueueAndPoll } = useExtensionJob()

  const upload = useCallback(async () => {
    if (!file) {
      toast.add({ type: "error", title: "Choose a CSV file" })
      return
    }
    const body = new FormData()
    body.set("file", file)
    const result = await enqueueAndPoll({
      extensionId: INGESTION_EXTENSION_ID,
      body,
      failTitle: "Upload failed",
      poll: true,
    })
    if (!result.ok || !("status" in result) || !result.status) {
      return
    }
    const status = result.status
    if (status.status === "failed" || status.status === "cancelled") {
      toast.add({
        type: "error",
        title: `Ingestion ${status.status}`,
        description: status.error ?? "Something went wrong. Try again.",
      })
    } else if (status.status === "completed") {
      toast.add({ type: "success", title: "Ingestion completed" })
    } else if (status.status === "running") {
      toast.add({
        type: "error",
        title: "Ingestion still running",
        description: status.error ?? "Timed out waiting for the job.",
      })
    }
  }, [enqueueAndPoll, file])

  return { file, setFile, pending, job, jobStatus, upload }
}

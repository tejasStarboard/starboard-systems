"use client"

import { useCallback, useState } from "react"

import { toast } from "@starboard/lib-ui/components/toast"

import {
  enqueueExtensionJobRequest,
  type EnqueueJobOptions,
  type ExtensionJobIds,
} from "@/hooks/extension-job-request"
import {
  pollExtensionJob,
  type PolledJobStatus,
} from "@/lib/poll-extension-job"

export type { ExtensionJobIds }

type EnqueueOptions = EnqueueJobOptions & {
  failTitle?: string
}

export function useExtensionJob() {
  const [pending, setPending] = useState(false)
  const [job, setJob] = useState<ExtensionJobIds | null>(null)
  const [jobStatus, setJobStatus] = useState<PolledJobStatus | null>(null)

  const enqueue = useCallback(async (options: EnqueueOptions) => {
    const failTitle = options.failTitle ?? "Job failed"
    setPending(true)
    setJob(null)
    setJobStatus(null)
    try {
      const result = await enqueueExtensionJobRequest(options)
      if (!result.ok) {
        if (result.aborted) {
          return { ok: false as const, aborted: true as const }
        }
        toast.add({
          type: "error",
          title: failTitle,
          description: result.error,
        })
        return { ok: false as const }
      }
      setJob(result.job)
      return { ok: true as const, job: result.job }
    } finally {
      setPending(false)
    }
  }, [])

  const enqueueAndPoll = useCallback(
    async (options: EnqueueOptions & { poll?: boolean }) => {
      const result = await enqueue(options)
      if (!result.ok || !("job" in result) || !result.job) {
        return result
      }
      if (options.poll === false) {
        return result
      }
      const failTitle = options.failTitle ?? "Job failed"
      setPending(true)
      setJobStatus({ status: "running" })
      try {
        const status = await pollExtensionJob({
          extensionId: options.extensionId,
          workflowId: result.job.workflowId,
          signal: options.signal,
        })
        setJobStatus(status)
        return { ...result, status }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return { ok: false as const, aborted: true as const }
        }
        toast.add({
          type: "error",
          title: failTitle,
          description:
            err instanceof Error
              ? err.message
              : "Something went wrong. Try again.",
        })
        return { ok: false as const }
      } finally {
        setPending(false)
      }
    },
    [enqueue]
  )

  return { pending, job, jobStatus, setJobStatus, enqueue, enqueueAndPoll }
}

"use client"

import { useEffect, useState } from "react"

import type { Rate } from "@starboard/lib-contracts"

import { RateDetail } from "../components/rate-detail"
import type { BuiltinEditorProps } from "../host"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; rate: Rate }

/**
 * `rate` editor: loads one catalog rate from the BFF and mounts `RateDetail`.
 */
export function RateEditor({ resourceId, host }: BuiltinEditorProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: "loading" })
    const id = encodeURIComponent(resourceId)

    async function load() {
      try {
        const response = await fetch(`/api/rates/${id}`, {
          signal: controller.signal,
        })
        const body = (await response.json().catch(() => null)) as
          (Rate & { error?: string }) | null
        if (response.status === 404) {
          setState({ status: "error", message: "Rate not found." })
          return
        }
        if (!response.ok || !body?.id) {
          setState({
            status: "error",
            message: body?.error ?? "Unable to load rate.",
          })
          return
        }
        setState({ status: "ready", rate: body })
      } catch (error) {
        if (controller.signal.aborted) return
        setState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Unable to load rate.",
        })
      }
    }

    void load()
    return () => controller.abort()
  }, [resourceId])

  if (state.status === "loading") {
    return <p className="p-4 text-xs text-muted-foreground">Loading rate…</p>
  }

  if (state.status === "error") {
    return (
      <p role="alert" className="p-4 text-sm text-muted-foreground">
        {state.message}
      </p>
    )
  }

  return (
    <RateDetail
      rate={state.rate}
      host={host}
      onChanged={(next) => {
        if (!next) {
          setState({ status: "error", message: "Rate deleted." })
          return
        }
        setState({ status: "ready", rate: next })
      }}
    />
  )
}

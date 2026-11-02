"use client"

import type { ComponentType } from "react"

import { Button } from "@starboard/lib-ui/components/button"

import type { BuiltinHost } from "../host"

type Contribution = {
  id: string
  label?: string
  component?: string
  props?: Record<string, string | number | boolean>
}

/**
 * Shared ingest action (`component: "rates.ingestUpload"`). Optional
 * `ingestion.*` workers contribute into `rates.slots.ingestActions` with this
 * factory; `props.href` is the upload deep link (default `/rates/upload`).
 */
export function UploadRatesAction({
  contribution,
  host,
}: {
  contribution: Contribution
  host?: Pick<BuiltinHost, "openEditor">
}) {
  const href =
    typeof contribution.props?.href === "string"
      ? contribution.props.href
      : "/rates/upload"
  const label = contribution.label ?? "Upload rates"

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      data-ingest-action={contribution.id}
      onClick={() => {
        if (host?.openEditor) {
          host.openEditor({
            viewType: "rates.upload",
            resourceId: href,
            title: label,
          })
          return
        }
        if (typeof window !== "undefined") {
          window.location.assign(href)
        }
      }}
    >
      {label}
    </Button>
  )
}

export type UploadRatesActionComponent = ComponentType<{
  contribution: Contribution
  host?: Pick<BuiltinHost, "openEditor">
}>

"use client"

import { useEffect, useState } from "react"

import { quotePreviewGap } from "@starboard/lib-contracts"
import type {
  PreviewSlotProps,
  SlotComponentProps,
} from "@starboard/ext-quoting-document/slots"

import { renderQuotePdfPreview } from "../lib/preview-pdf"

/**
 * `quoting.pdf.preview` → `quoting.slots.preview` (PDF tab). Renders the 083
 * PDF in the browser from the host's debounced form snapshot into a blob URL.
 * The previous PDF stays visible while the next one renders. Preview is not
 * stage-gated; the Export command keeps its 083 status gates.
 */
export function PdfPreview({ quote }: SlotComponentProps<PreviewSlotProps>) {
  const gap = quotePreviewGap(quote)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // Revoke a blob URL only once it is no longer the displayed one: this
  // cleanup runs after the render that swapped `url` (and on unmount), so the
  // previous PDF stays alive until its replacement is committed.
  useEffect(() => {
    if (!url) return
    return () => URL.revokeObjectURL(url)
  }, [url])

  useEffect(() => {
    if (gap) {
      setUrl(null)
      setError(null)
      setPending(false)
      return
    }
    let cancelled = false
    setPending(true)
    renderQuotePdfPreview(quote)
      .then((bytes) => {
        if (cancelled) return
        setUrl(
          URL.createObjectURL(
            new Blob([new Uint8Array(bytes)], { type: "application/pdf" })
          )
        )
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(
          cause instanceof Error ? cause.message : "Unable to render preview"
        )
      })
      .finally(() => {
        if (!cancelled) setPending(false)
      })
    return () => {
      cancelled = true
    }
  }, [quote, gap])

  if (gap) {
    return (
      <div
        data-testid="quote-preview-pdf-empty"
        className="mx-auto flex aspect-[1/1.3] w-full max-w-md items-center justify-center border bg-background p-5 text-center text-sm text-muted-foreground shadow-sm"
      >
        {gap}
      </div>
    )
  }

  return (
    <div
      data-testid="quote-preview-pdf"
      data-pending={pending ? "true" : "false"}
      className="mx-auto w-full max-w-md space-y-2"
    >
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {url ? (
        <iframe
          title={`Quote ${quote.quoteId || "draft"} PDF preview`}
          src={`${url}#toolbar=0&navpanes=0`}
          className="aspect-[1/1.3] w-full border bg-background shadow-sm"
        />
      ) : (
        <div className="flex aspect-[1/1.3] w-full items-center justify-center border bg-background text-sm text-muted-foreground shadow-sm">
          Rendering preview…
        </div>
      )}
    </div>
  )
}

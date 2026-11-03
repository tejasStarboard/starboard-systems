"use client"

import { useEffect, useState } from "react"

import {
  quotePreviewGap,
  type QuoteDocumentOrg,
} from "@starboard/lib-contracts"
import type {
  PreviewSlotProps,
  SlotComponentProps,
} from "@starboard/ext-quoting-document/slots"

import { buildQuoteDocumentView } from "../lib/build-document-view"

type PdfContext = { org: QuoteDocumentOrg; templateId: string }

/**
 * `quoting.pdf.preview` → `quoting.slots.preview` (PDF tab). Builds the
 * `QuoteDocumentView` from the host's debounced form snapshot + org context
 * (`/api/quotes/preview/pdf-context`: branding + selected template id), then
 * renders the selected `quoting.pdf.templates` template with
 * `@react-pdf/renderer` into a blob URL. The previous PDF stays visible while
 * the next renders. Preview is not stage-gated; Export keeps its status gates.
 */
export function PdfPreview({
  quote,
  customerName,
}: SlotComponentProps<PreviewSlotProps>) {
  const gap = quotePreviewGap(quote)
  const [context, setContext] = useState<PdfContext | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/quotes/preview/pdf-context", { signal: controller.signal })
      .then(async (response) =>
        response.ok ? ((await response.json()) as PdfContext) : null
      )
      .then((payload) => {
        if (!controller.signal.aborted) setContext(payload)
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

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
    // react-pdf is heavy: load it only when a preview actually renders.
    Promise.all([import("../templates"), import("../templates/render")])
      .then(([{ resolveQuotePdfTemplate }, { renderQuotePdfBlob }]) => {
        const view = buildQuoteDocumentView(quote, {
          org: context?.org,
          customerName,
        })
        const template = resolveQuotePdfTemplate({
          requested: context?.templateId,
        })
        return renderQuotePdfBlob(view, template)
      })
      .then((blob) => {
        if (cancelled) return
        setUrl(URL.createObjectURL(blob))
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
  }, [quote, gap, context, customerName])

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

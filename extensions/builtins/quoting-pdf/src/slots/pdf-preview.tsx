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

type PdfContext = {
  org: QuoteDocumentOrg
  templateId: string
  activeTemplateIds: string[]
}

/** Preview must match export: never render until org context has loaded. */
type ContextState =
  | { status: "loading" }
  | { status: "ready"; context: PdfContext }
  | { status: "error"; message: string }

/**
 * `quoting.pdf.preview` → `quoting.slots.preview` (PDF tab). Builds the
 * `QuoteDocumentView` from the host's debounced form snapshot + org context
 * (`/api/quotes/preview/pdf-context`: branding + selected template id; the
 * preview waits for it and surfaces failures instead of rendering the wrong
 * default), then renders the selected `quoting.pdf.templates` template with
 * `@react-pdf/renderer` into a blob URL. The previous PDF stays visible while
 * the next renders. Preview is not stage-gated; Export keeps its status gates.
 */
export function PdfPreview({
  quote,
  customerName,
}: SlotComponentProps<PreviewSlotProps>) {
  const gap = quotePreviewGap(quote)
  const [contextState, setContextState] = useState<ContextState>({
    status: "loading",
  })
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/quotes/preview/pdf-context", { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          (Partial<PdfContext> & { error?: string }) | null
        if (controller.signal.aborted) return
        if (!response.ok || !payload?.org || !payload.templateId) {
          throw new Error(
            payload?.error ?? `Preview context failed (${response.status})`
          )
        }
        setContextState({
          status: "ready",
          context: {
            org: payload.org,
            templateId: payload.templateId,
            activeTemplateIds: payload.activeTemplateIds ?? [],
          },
        })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setContextState({
          status: "error",
          message:
            cause instanceof Error
              ? cause.message
              : "Unable to load preview context",
        })
      })
    return () => controller.abort()
  }, [])
  const context = contextState.status === "ready" ? contextState.context : null

  // Revoke a blob URL only once it is no longer the displayed one: this
  // cleanup runs after the render that swapped `url` (and on unmount), so the
  // previous PDF stays alive until its replacement is committed.
  useEffect(() => {
    if (!url) return
    return () => URL.revokeObjectURL(url)
  }, [url])

  useEffect(() => {
    if (gap || !context) {
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
          org: context.org,
          customerName,
        })
        const template = resolveQuotePdfTemplate({
          requested: context.templateId,
          activeIds: context.activeTemplateIds,
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
      {contextState.status === "error" || error ? (
        <p role="alert" className="text-xs text-destructive">
          {contextState.status === "error" ? contextState.message : error}
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
          {contextState.status === "error"
            ? "Preview unavailable"
            : "Rendering preview…"}
        </div>
      )}
    </div>
  )
}

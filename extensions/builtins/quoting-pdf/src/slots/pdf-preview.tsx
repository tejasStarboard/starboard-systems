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
import { LoadingState } from "@starboard/lib-ui/components/loading-state"
import { cn } from "@starboard/lib-ui/lib/utils"

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

const SCROLL_HIDE =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"

/**
 * `quoting.pdf.preview` → `quoting.slots.preview` (PDF tab). Builds the
 * `QuoteDocumentView` from the host's debounced form snapshot + org context
 * (`/api/quotes/preview/pdf-context`: branding + selected template id; the
 * preview waits for it and surfaces failures instead of rendering the wrong
 * default), then renders the selected `quoting.pdf.templates` template with
 * `@react-pdf/renderer` into a blob URL. The previous PDF stays visible while
 * the next renders. Preview is not stage-gated; Export keeps its status gates.
 *
 * Zoom is left to the browser PDF viewer (no custom Fit/slider chrome).
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
        className="flex min-h-0 flex-1 items-center justify-center p-5 text-center text-sm text-muted-foreground"
      >
        {gap}
      </div>
    )
  }

  return (
    <div
      data-testid="quote-preview-pdf"
      data-pending={pending ? "true" : "false"}
      className="flex min-h-0 flex-1 flex-col"
    >
      {contextState.status === "error" || error ? (
        <p role="alert" className="shrink-0 px-3 py-2 text-xs text-destructive">
          {contextState.status === "error" ? contextState.message : error}
        </p>
      ) : null}
      {url ? (
        <div
          data-testid="quote-preview-pdf-viewport"
          className={cn("relative min-h-0 flex-1 overflow-hidden", SCROLL_HIDE)}
        >
          <iframe
            title={`Quote ${quote.quoteId || "draft"} PDF preview`}
            src={url}
            className={cn(
              "size-full border-0 bg-muted/40 transition-opacity",
              pending && "opacity-40"
            )}
          />
          {pending ? (
            <div
              data-testid="quote-preview-pdf-updating"
              className="absolute inset-0 flex items-center justify-center bg-background/55"
              aria-live="polite"
            >
              <LoadingState
                size="inline"
                className="w-auto rounded-none bg-background/90 px-3 py-2 ring-1 ring-foreground/10"
              >
                Updating preview…
              </LoadingState>
            </div>
          ) : null}
        </div>
      ) : contextState.status === "error" ? (
        <p className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
          Preview unavailable
        </p>
      ) : (
        <LoadingState className="min-h-0 flex-1">
          Rendering preview…
        </LoadingState>
      )}
    </div>
  )
}

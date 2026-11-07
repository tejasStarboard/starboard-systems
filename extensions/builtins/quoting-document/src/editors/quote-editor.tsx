"use client"

import { useEffect, useRef, useState } from "react"

import { LoadingState } from "@starboard/lib-ui/components/loading-state"

import type { BuiltinEditorProps } from "../host"
import { QuoteForm } from "../components/quote-form"
import { QuoteSlotsProvider } from "../slots/slot-host"
import {
  prepareQuoteEditorInput,
  type QuoteEditorContext,
  type QuoteEditorInput,
} from "../lib/quote-editor-input"

const NO_COMPONENTS = {} as const

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; input: QuoteEditorInput }

/**
 * `quote` editor: loads the quote + form options from the BFF
 * (`/api/quotes/:id/editor-context`) and mounts `QuoteForm`. Save still PUTs
 * `/api/quotes/:id`. The editor-context `slots` (active contributions to the
 * slots this extension defines) + `host.pointComponents` feed the slot hosts.
 */
export function QuoteEditor({ resourceId, host }: BuiltinEditorProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const setEditorTitleRef = useRef(host.setEditorTitle)
  setEditorTitleRef.current = host.setEditorTitle

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: "loading" })

    async function load() {
      try {
        const response = await fetch(
          `/api/quotes/${encodeURIComponent(resourceId)}/editor-context`,
          { signal: controller.signal }
        )
        const body = (await response.json().catch(() => null)) as
          (QuoteEditorContext & { error?: string }) | null
        if (!response.ok || !body?.quote || !body.options) {
          setState({
            status: "error",
            message:
              response.status === 404
                ? "Quote not found."
                : (body?.error ?? "Unable to load quote."),
          })
          return
        }
        const input = prepareQuoteEditorInput(body)
        if (input.defaultValues.quoteId) {
          setEditorTitleRef.current?.(input.defaultValues.quoteId)
        }
        setState({
          status: "ready",
          input,
        })
      } catch (error) {
        if (controller.signal.aborted) return
        setState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Unable to load quote.",
        })
      }
    }

    void load()
    return () => controller.abort()
  }, [resourceId])

  if (state.status === "loading") {
    return (
      <LoadingState data-testid="quote-editor-loading">
        Loading quote…
      </LoadingState>
    )
  }

  if (state.status === "error") {
    return (
      <p role="alert" className="p-4 text-sm text-destructive">
        {state.message}
      </p>
    )
  }

  const { slots, ...formInput } = state.input
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-3 sm:p-4">
      <QuoteSlotsProvider
        slots={slots}
        components={host.pointComponents ?? NO_COMPONENTS}
      >
        <QuoteForm
          key={resourceId}
          {...formInput}
          onOpenPreview={() =>
            host.openEditor({
              viewType: "quote.preview",
              resourceId,
              title: formInput.defaultValues.quoteId || "Preview",
              side: "beside",
            })
          }
        />
      </QuoteSlotsProvider>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"

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
        setState({
          status: "ready",
          input: prepareQuoteEditorInput(body),
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
      <p
        data-testid="quote-editor-loading"
        className="p-4 text-xs text-muted-foreground"
      >
        Loading quote…
      </p>
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
    <div className="flex flex-1 flex-col p-3 sm:p-4">
      <QuoteSlotsProvider
        slots={slots}
        components={host.pointComponents ?? NO_COMPONENTS}
      >
        <QuoteForm key={resourceId} {...formInput} />
      </QuoteSlotsProvider>
    </div>
  )
}

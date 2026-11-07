"use client"

import { useEffect, useState } from "react"
import {
  CheckIcon,
  CopyIcon,
  EnvelopeSimpleOpenIcon,
} from "@phosphor-icons/react"

import { quotePreviewGap } from "@starboard/lib-contracts"
import type {
  PreviewSlotProps,
  SlotComponentProps,
} from "@starboard/ext-quoting-document/slots"
import { Button } from "@starboard/lib-ui/components/button"
import { ButtonGroup } from "@starboard/lib-ui/components/button-group"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"
import { cn } from "@starboard/lib-ui/lib/utils"

type EmailPreviewResult = { subject: string; html: string }

const SCROLL_HIDE =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"

/**
 * `quoting.email.preview` → `quoting.slots.preview` (Email tab). Fetches the
 * react-email quote draft HTML from the BFF for the host's debounced form
 * snapshot (so unsaved edits show) and renders it in a sandboxed frame. The
 * previous HTML stays visible while the next regenerates. Copy HTML / open
 * draft only — sending via messaging is out of scope.
 */
export function EmailPreview({
  quote,
  customerName,
}: SlotComponentProps<PreviewSlotProps>) {
  const gap = quotePreviewGap(quote)
  const [result, setResult] = useState<EmailPreviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (gap) {
      setResult(null)
      setError(null)
      setPending(false)
      return
    }
    const controller = new AbortController()
    setPending(true)
    fetch("/api/quotes/preview/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote, customerName }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          (Partial<EmailPreviewResult> & { error?: string }) | null
        if (controller.signal.aborted) return
        if (!response.ok || !payload?.html) {
          throw new Error(
            payload?.error ?? `Preview failed (${response.status})`
          )
        }
        setResult({ subject: payload.subject ?? "", html: payload.html })
        setError(null)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(
          cause instanceof Error ? cause.message : "Unable to render preview"
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setPending(false)
      })
    return () => controller.abort()
  }, [quote, customerName, gap])

  async function onCopy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.html)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError("Unable to copy to clipboard")
    }
  }

  function onOpenDraft() {
    if (!result) return
    // Write into a blank tab (no blob URL to revoke, so open tabs never break).
    const tab = window.open("", "_blank")
    if (!tab) return
    tab.opener = null
    tab.document.open()
    tab.document.write(result.html)
    tab.document.close()
  }

  if (gap) {
    return (
      <div
        data-testid="quote-preview-email-empty"
        className="flex min-h-0 flex-1 items-center justify-center p-5 text-center text-sm text-muted-foreground"
      >
        {gap}
      </div>
    )
  }

  return (
    <div
      data-testid="quote-preview-email"
      data-pending={pending ? "true" : "false"}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-2 py-1.5">
        <p
          className="min-w-0 truncate text-xs text-muted-foreground"
          data-testid="quote-preview-email-subject"
        >
          Subject: {result?.subject || "…"}
        </p>
        <ButtonGroup aria-label="Email preview actions" className="shrink-0">
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={!result}
            onClick={() => void onCopy()}
            data-testid="quote-email-copy-html"
          >
            {copied ? (
              <CheckIcon className="size-3.5" />
            ) : (
              <CopyIcon className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy HTML"}
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={!result}
            onClick={onOpenDraft}
            data-testid="quote-email-open-draft"
          >
            <EnvelopeSimpleOpenIcon className="size-3.5" />
            Open draft
          </Button>
        </ButtonGroup>
      </div>
      {error ? (
        <p role="alert" className="shrink-0 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-auto overscroll-contain bg-muted/40 p-4",
          SCROLL_HIDE
        )}
      >
        {result ? (
          <>
            <iframe
              title="Quote email preview"
              sandbox=""
              srcDoc={result.html}
              className={cn(
                "mx-auto min-h-full w-full min-w-[36rem] border bg-white shadow-sm transition-opacity",
                pending && "opacity-40"
              )}
              style={{ height: "max(100%, 48rem)" }}
            />
            {pending ? (
              <div
                data-testid="quote-preview-email-updating"
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
          </>
        ) : (
          <LoadingState className="h-full min-h-64">
            Rendering preview…
          </LoadingState>
        )}
      </div>
    </div>
  )
}

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

type EmailPreviewResult = { subject: string; html: string }

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
        className="mx-auto flex w-full max-w-md items-center justify-center border bg-background p-5 py-16 text-center text-sm text-muted-foreground shadow-sm"
      >
        {gap}
      </div>
    )
  }

  return (
    <div
      data-testid="quote-preview-email"
      data-pending={pending ? "true" : "false"}
      className="mx-auto w-full max-w-xl space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="min-w-0 truncate text-xs text-muted-foreground"
          data-testid="quote-preview-email-subject"
        >
          Subject: {result?.subject || "…"}
        </p>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!result}
            onClick={() => void onCopy()}
            data-testid="quote-email-copy-html"
          >
            {copied ? (
              <CheckIcon className="size-4" />
            ) : (
              <CopyIcon className="size-4" />
            )}
            {copied ? "Copied" : "Copy HTML"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!result}
            onClick={onOpenDraft}
            data-testid="quote-email-open-draft"
          >
            <EnvelopeSimpleOpenIcon className="size-4" />
            Open draft
          </Button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {result ? (
        <iframe
          title="Quote email preview"
          sandbox=""
          srcDoc={result.html}
          className="h-[640px] w-full border bg-white shadow-sm"
        />
      ) : (
        <div className="flex h-64 w-full items-center justify-center border bg-background text-sm text-muted-foreground shadow-sm">
          Rendering preview…
        </div>
      )}
    </div>
  )
}

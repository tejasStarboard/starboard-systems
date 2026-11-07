"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useWatch, type Control } from "react-hook-form"

import { Button } from "@starboard/lib-ui/components/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@starboard/lib-ui/components/button-group"
import { Card, CardContent } from "@starboard/lib-ui/components/card"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"
import { Skeleton } from "@starboard/lib-ui/components/skeleton"
import { cn } from "@starboard/lib-ui/lib/utils"

import type { QuoteFormValues } from "@starboard/lib-contracts"

import { contributesToPreviewTab } from "../lib/preview-tabs"
import type { QuoteStepId } from "../lib/quote-builder-steps"
import type { QuoteFormOption } from "../lib/quotes.schema"
import { QuoteSlot, useQuoteSlotEntries } from "../slots/slot-host"
import {
  QUOTING_SLOTS,
  type PreviewSlotProps,
  type PreviewTab,
} from "../slots/types"

const PREVIEW_DEBOUNCE_MS = 300

/** Inputs the PDF | Email surface needs (builder or standalone preview tab). */
export type QuotePreviewSource = {
  control: Control<QuoteFormValues>
  /** Human short quote id (display). */
  quoteId: string
  customerOptions: QuoteFormOption[]
  selectedLaneIndex: number
  currencyCode: string
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

function stubMessage(forTab: PreviewTab) {
  return forTab === "pdf"
    ? "PDF preview is turned off for this workspace."
    : "Email preview is turned off for this workspace."
}

function StubLines({ rows }: { rows: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-2.5", index % 3 === 2 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  )
}

/** Shown when a tab has no active contributor (extension unplugged). */
function TabStub({ tab }: { tab: PreviewTab }) {
  return (
    <Card
      data-testid={`quote-preview-${tab}-stub`}
      className="mx-auto w-full max-w-md gap-4 py-5"
    >
      <CardContent className="flex flex-col gap-4">
        <StubLines rows={6} />
        <p className="text-[11px] text-muted-foreground">{stubMessage(tab)}</p>
      </CardContent>
    </Card>
  )
}

/**
 * Preview chrome + host for `quoting.slots.preview` (092): PDF | Email tabs.
 * Fills the editor pane height; slot bodies own x/y scrolling.
 */
export function QuotePreviewPane({
  source,
  step = "route",
  className,
  hideHeading,
  toolbarStart,
  refreshing = false,
}: {
  source: QuotePreviewSource
  step?: QuoteStepId
  className?: string
  /** Parent already titles the pane. */
  hideHeading?: boolean
  /** Compact chrome on the left of PDF | Email (e.g. quote picker). */
  toolbarStart?: ReactNode
  /** Soft reload after save — show status before PDF/email re-render kicks in. */
  refreshing?: boolean
}) {
  // API paths need the persisted row UUID (`id`); human `quoteId` is display.
  const resourceId = (useWatch({ control: source.control, name: "id" }) ??
    "") as string
  const liveQuote = useWatch({
    control: source.control,
  }) as QuoteFormValues
  const customerId = liveQuote?.customerId ?? ""
  const [tab, setTab] = useState<PreviewTab>("pdf")
  const entries = useQuoteSlotEntries(QUOTING_SLOTS.preview)
  const quote = useDebouncedValue(liveQuote, PREVIEW_DEBOUNCE_MS)
  // Live form moved ahead of the debounced snapshot slots still render.
  const awaitingPreview = refreshing || quote !== liveQuote
  const customerName =
    source.customerOptions.find((option) => option.value === customerId)
      ?.label ?? ""

  function body(forTab: PreviewTab) {
    const hasContributor = entries.some((entry) =>
      contributesToPreviewTab(entry.contribution, forTab)
    )
    if (!hasContributor) {
      return <TabStub tab={forTab} />
    }
    const slotProps: PreviewSlotProps = {
      control: source.control,
      quoteId: resourceId,
      quoteNumber: source.quoteId,
      quote,
      customerName,
      tab: forTab,
      step,
      selectedLaneIndex: source.selectedLaneIndex,
      currencyCode: source.currencyCode,
    }
    return (
      <QuoteSlot
        point={QUOTING_SLOTS.preview}
        props={slotProps}
        className="flex min-h-0 flex-1 flex-col"
        filter={(contribution) => contributesToPreviewTab(contribution, forTab)}
      />
    )
  }

  return (
    <section
      aria-label="Quote preview"
      data-testid="quote-preview-pane"
      className={cn("flex min-h-0 flex-1 flex-col", className)}
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-2 py-1.5">
        {toolbarStart ? (
          <div className="min-w-0 flex-1">{toolbarStart}</div>
        ) : hideHeading ? (
          <span className="min-w-0 flex-1" />
        ) : (
          <h2 className="min-w-0 flex-1 text-sm font-medium">Preview</h2>
        )}
        {awaitingPreview ? (
          <LoadingState
            size="inline"
            data-testid="quote-preview-refreshing"
            className="w-auto shrink-0 py-0"
          >
            Updating…
          </LoadingState>
        ) : null}
        <ButtonGroup aria-label="Preview mode" className="shrink-0">
          <Button
            type="button"
            id="quote-preview-mode-pdf"
            size="sm"
            variant={tab === "pdf" ? "secondary" : "outline"}
            aria-pressed={tab === "pdf"}
            aria-controls="quote-preview-panel-pdf"
            data-testid="quote-preview-mode-pdf"
            onClick={() => setTab("pdf")}
          >
            PDF
          </Button>
          <ButtonGroupSeparator />
          <Button
            type="button"
            id="quote-preview-mode-email"
            size="sm"
            variant={tab === "email" ? "secondary" : "outline"}
            aria-pressed={tab === "email"}
            aria-controls="quote-preview-panel-email"
            data-testid="quote-preview-mode-email"
            onClick={() => setTab("email")}
          >
            Email
          </Button>
        </ButtonGroup>
      </div>
      <div
        role="tabpanel"
        id="quote-preview-panel-pdf"
        aria-labelledby="quote-preview-mode-pdf"
        hidden={tab !== "pdf"}
        className={cn(
          "min-h-0 flex-1 flex-col overflow-hidden",
          tab === "pdf" ? "flex" : "hidden"
        )}
      >
        {body("pdf")}
      </div>
      <div
        role="tabpanel"
        id="quote-preview-panel-email"
        aria-labelledby="quote-preview-mode-email"
        hidden={tab !== "email"}
        className={cn(
          "min-h-0 flex-1 flex-col overflow-hidden",
          tab === "email" ? "flex" : "hidden"
        )}
      >
        {body("email")}
      </div>
    </section>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useWatch } from "react-hook-form"

import { Skeleton } from "@starboard/lib-ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@starboard/lib-ui/components/tabs"
import { cn } from "@starboard/lib-ui/lib/utils"

import type { QuoteStepId } from "../lib/quote-builder-steps"
import { QuoteSlot, useQuoteSlotEntries } from "../slots/slot-host"
import {
  QUOTING_SLOTS,
  type PreviewSlotProps,
  type PreviewTab,
} from "../slots/types"
import type { QuoteFormLayoutProps } from "./quote-form-layout-props"

const PREVIEW_DEBOUNCE_MS = 300

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

type StubSnapshot = {
  quoteId: string
  currencyCode: string
  origin: string
  destination: string
}

function emptyMessage(step: QuoteStepId, snapshot: StubSnapshot) {
  if (step === "basics") {
    return "Pick a customer and currency to start the quote."
  }
  if (!snapshot.origin || !snapshot.destination) {
    return "Select ports to see route on the quote."
  }
  return "Live preview arrives with the PDF and email templates."
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

function PdfStub({
  snapshot,
  step,
}: {
  snapshot: StubSnapshot
  step: QuoteStepId
}) {
  const route =
    snapshot.origin && snapshot.destination
      ? `${snapshot.origin} → ${snapshot.destination}`
      : null
  return (
    <div
      data-testid="quote-preview-pdf-stub"
      className="mx-auto flex aspect-[1/1.3] w-full max-w-md flex-col gap-4 border bg-background p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-6 w-24" aria-hidden />
        <div className="text-right text-[11px] text-muted-foreground">
          <p className="tabular-nums">Quote {snapshot.quoteId || "—"}</p>
          <p className="tabular-nums">{snapshot.currencyCode || "—"}</p>
        </div>
      </div>
      <StubLines rows={2} />
      <p className="text-xs font-medium">{route ?? "Route not set"}</p>
      <StubLines rows={5} />
      <p className="mt-auto text-[11px] text-muted-foreground">
        {emptyMessage(step, snapshot)}
      </p>
    </div>
  )
}

function EmailStub({
  snapshot,
  step,
}: {
  snapshot: StubSnapshot
  step: QuoteStepId
}) {
  return (
    <div
      data-testid="quote-preview-email-stub"
      className="mx-auto flex w-full max-w-md flex-col gap-4 border bg-background p-5 shadow-sm"
    >
      <div className="space-y-2 border-b pb-3 text-[11px] text-muted-foreground">
        <p>
          To: <span className="inline-block h-2.5 w-32 bg-muted align-middle" />
        </p>
        <p>
          Subject: Quote {snapshot.quoteId || "—"}
          {snapshot.origin && snapshot.destination
            ? ` · ${snapshot.origin} → ${snapshot.destination}`
            : ""}
        </p>
      </div>
      <StubLines rows={6} />
      <p className="text-[11px] text-muted-foreground">
        {emptyMessage(step, snapshot)}
      </p>
    </div>
  )
}

/**
 * Preview chrome (ticket 089): PDF | Email tabs + document frame. Body comes
 * from `quoting.slots.preview` contributions (092); otherwise a stub that
 * follows form state with a ~300ms debounce.
 */
export function QuotePreviewPane({
  layoutProps,
  step,
  className,
  hideHeading,
}: {
  layoutProps: QuoteFormLayoutProps
  step: QuoteStepId
  className?: string
  /** Sheet already titles the pane. */
  hideHeading?: boolean
}) {
  // API paths need the persisted row UUID (`id`), like the commands slot; the
  // human `quoteId` is for display only.
  const resourceId = (useWatch({ control: layoutProps.control, name: "id" }) ??
    "") as string
  const [tab, setTab] = useState<PreviewTab>("pdf")
  const hasContributor = useQuoteSlotEntries(QUOTING_SLOTS.preview).length > 0
  const snapshot = useDebouncedValue<StubSnapshot>(
    {
      quoteId: layoutProps.quoteId,
      currencyCode: layoutProps.currencyCode,
      origin: layoutProps.selectedLane?.origin.trim() ?? "",
      destination: layoutProps.selectedLane?.destination.trim() ?? "",
    },
    PREVIEW_DEBOUNCE_MS
  )

  function body(forTab: PreviewTab) {
    if (hasContributor) {
      const slotProps: PreviewSlotProps = {
        control: layoutProps.control,
        quoteId: resourceId,
        quoteNumber: layoutProps.quoteId,
        tab: forTab,
        step,
        selectedLaneIndex: layoutProps.selectedLaneIndex,
        currencyCode: layoutProps.currencyCode,
      }
      return <QuoteSlot point={QUOTING_SLOTS.preview} props={slotProps} />
    }
    return forTab === "pdf" ? (
      <PdfStub snapshot={snapshot} step={step} />
    ) : (
      <EmailStub snapshot={snapshot} step={step} />
    )
  }

  return (
    <section
      aria-label="Quote preview"
      data-testid="quote-preview-pane"
      className={cn("flex min-h-0 flex-col gap-3", className)}
    >
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value === "email" ? "email" : "pdf")}
      >
        <div className="flex items-center justify-between gap-2">
          {hideHeading ? (
            <span />
          ) : (
            <h2 className="text-sm font-medium">Preview</h2>
          )}
          <TabsList>
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="pdf" className="overflow-y-auto bg-muted/40 p-3">
          {body("pdf")}
        </TabsContent>
        <TabsContent value="email" className="overflow-y-auto bg-muted/40 p-3">
          {body("email")}
        </TabsContent>
      </Tabs>
    </section>
  )
}

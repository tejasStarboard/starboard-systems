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

import type { QuoteFormValues } from "@starboard/lib-contracts"

import { contributesToPreviewTab } from "../lib/preview-tabs"
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
    <div
      data-testid={`quote-preview-${tab}-stub`}
      className="mx-auto flex w-full max-w-md flex-col gap-4 border bg-background p-5 shadow-sm"
    >
      <StubLines rows={6} />
      <p className="text-[11px] text-muted-foreground">{stubMessage(tab)}</p>
    </div>
  )
}

/**
 * Preview chrome (089) + host for `quoting.slots.preview` (092): PDF | Email
 * tabs and document frame. The pane debounces the whole form (~300ms) and
 * hands the snapshot to each tab's contributor; a tab with no active
 * contributor shows a stub (unplug). Never blocks typing on regen.
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
  const liveQuote = useWatch({
    control: layoutProps.control,
  }) as QuoteFormValues
  const customerId = liveQuote?.customerId ?? ""
  const [tab, setTab] = useState<PreviewTab>("pdf")
  const entries = useQuoteSlotEntries(QUOTING_SLOTS.preview)
  const quote = useDebouncedValue(liveQuote, PREVIEW_DEBOUNCE_MS)
  const customerName =
    layoutProps.customerOptions.find((option) => option.value === customerId)
      ?.label ?? ""

  function body(forTab: PreviewTab) {
    const hasContributor = entries.some((entry) =>
      contributesToPreviewTab(entry.contribution, forTab)
    )
    if (!hasContributor) {
      return <TabStub tab={forTab} />
    }
    const slotProps: PreviewSlotProps = {
      control: layoutProps.control,
      quoteId: resourceId,
      quoteNumber: layoutProps.quoteId,
      quote,
      customerName,
      tab: forTab,
      step,
      selectedLaneIndex: layoutProps.selectedLaneIndex,
      currencyCode: layoutProps.currencyCode,
    }
    return (
      <QuoteSlot
        point={QUOTING_SLOTS.preview}
        props={slotProps}
        filter={(contribution) => contributesToPreviewTab(contribution, forTab)}
      />
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

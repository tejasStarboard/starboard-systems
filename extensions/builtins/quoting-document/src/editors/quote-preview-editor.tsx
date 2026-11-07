"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"

import type { QuoteListItemView } from "@starboard/lib-contracts"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@starboard/lib-ui/components/select"

import type { BuiltinEditorProps } from "../host"
import { QuotePreviewPane } from "../components/quote-preview-pane"
import { subscribeQuoteSaved } from "../lib/quote-events"
import {
  prepareQuoteEditorInput,
  type QuoteEditorContext,
} from "../lib/quote-editor-input"
import {
  emptyQuoteFormValues,
  type QuoteFormValues,
} from "../lib/quotes.schema"
import { QuoteSlotsProvider } from "../slots/slot-host"

const NO_COMPONENTS = {} as const
/** Sentinel resourceId from status-bar open (no quote chosen yet). */
export const PREVIEW_EMPTY_RESOURCE = "-"
/** Stable empty form for RHF `values` when no quote is loaded (avoids update loops). */
const EMPTY_PREVIEW_VALUES = emptyQuoteFormValues({ id: "" })

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; quotes: QuoteListItemView[] }

type QuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready"
      input: ReturnType<typeof prepareQuoteEditorInput>
    }

function initialSelectedId(resourceId: string): string {
  return resourceId === PREVIEW_EMPTY_RESOURCE || !resourceId.trim()
    ? ""
    : resourceId
}

function quotePickerLabel(
  item: Pick<QuoteListItemView, "id" | "quoteId" | "customerName">
): string {
  if (item.customerName) return `${item.quoteId} · ${item.customerName}`
  return item.quoteId || item.id.slice(0, 8)
}

/**
 * Standalone `quote.preview` editor: quote picker + PDF | Email surface.
 * Opened from `workbench.statusBar` (or the builder Preview shortcut). Bodies
 * stay on `quoting.slots.preview`.
 */
export function QuotePreviewEditor({ resourceId, host }: BuiltinEditorProps) {
  const [selectedId, setSelectedId] = useState(() =>
    initialSelectedId(resourceId)
  )
  const [list, setList] = useState<ListState>({ status: "loading" })
  const [quote, setQuote] = useState<QuoteState>({ status: "idle" })
  /** Bumped on quote-saved so an open preview reloads without remounting. */
  const [reloadToken, setReloadToken] = useState(0)
  /** Soft reload in flight (keep prior PDF; show updating chrome). */
  const [refreshing, setRefreshing] = useState(false)
  const quoteRef = useRef(quote)
  quoteRef.current = quote
  const setEditorTitleRef = useRef(host.setEditorTitle)
  setEditorTitleRef.current = host.setEditorTitle

  useEffect(() => {
    setSelectedId(initialSelectedId(resourceId))
  }, [resourceId])

  useEffect(() => {
    return subscribeQuoteSaved((quoteId) => {
      if (quoteId === selectedId) {
        setReloadToken((token) => token + 1)
      }
    })
  }, [selectedId])

  useEffect(() => {
    const controller = new AbortController()
    async function loadList() {
      try {
        const response = await fetch("/api/quotes?page=1&pageSize=50", {
          signal: controller.signal,
        })
        const body = (await response.json().catch(() => null)) as {
          quotes?: QuoteListItemView[]
          error?: string
        } | null
        if (!response.ok || !body?.quotes) {
          setList({
            status: "error",
            message: body?.error ?? "Unable to load quotes.",
          })
          return
        }
        setList({ status: "ready", quotes: body.quotes })
      } catch (error) {
        if (controller.signal.aborted) return
        setList({
          status: "error",
          message:
            error instanceof Error ? error.message : "Unable to load quotes.",
        })
      }
    }
    void loadList()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setQuote((prev) => (prev.status === "idle" ? prev : { status: "idle" }))
      setEditorTitleRef.current?.("Preview")
      return
    }
    const controller = new AbortController()
    // Keep the previous PDF visible on soft reload after save; only show the
    // full loading chrome on the first load for this selection.
    const prev = quoteRef.current
    const softReload =
      prev.status === "ready" && prev.input.defaultValues.id === selectedId
    setQuote(softReload ? prev : { status: "loading" })
    if (softReload) {
      setRefreshing(true)
    }

    async function loadQuote() {
      try {
        const response = await fetch(
          `/api/quotes/${encodeURIComponent(selectedId)}/editor-context`,
          { signal: controller.signal }
        )
        const body = (await response.json().catch(() => null)) as
          | (QuoteEditorContext & { error?: string })
          | null
        if (!response.ok || !body?.quote || !body.options) {
          setQuote({
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
        setQuote({ status: "ready", input })
      } catch (error) {
        if (controller.signal.aborted) return
        setQuote({
          status: "error",
          message:
            error instanceof Error ? error.message : "Unable to load quote.",
        })
      } finally {
        if (!controller.signal.aborted) setRefreshing(false)
      }
    }

    void loadQuote()
    return () => {
      controller.abort()
      setRefreshing(false)
    }
  }, [selectedId, reloadToken])

  const formValues =
    quote.status === "ready"
      ? quote.input.defaultValues
      : EMPTY_PREVIEW_VALUES

  const form = useForm<QuoteFormValues>({
    values: formValues,
  })

  const selectItems = useMemo(() => {
    const fromList =
      list.status === "ready"
        ? list.quotes.map((item) => ({
            value: item.id,
            label: quotePickerLabel(item),
          }))
        : []

    // Keep a SelectItem for the open quote so the trigger never falls back
    // to the raw UUID (deep link / quote outside first page).
    if (
      selectedId &&
      !fromList.some((item) => item.value === selectedId) &&
      quote.status === "ready" &&
      quote.input.defaultValues.quoteId
    ) {
      const customerName =
        quote.input.customerOptions.find(
          (option) => option.value === quote.input.defaultValues.customerId
        )?.label ?? null
      return [
        {
          value: selectedId,
          label: customerName
            ? `${quote.input.defaultValues.quoteId} · ${customerName}`
            : quote.input.defaultValues.quoteId,
        },
        ...fromList,
      ]
    }

    return fromList
  }, [list, selectedId, quote])

  const selectedLabel =
    selectItems.find((item) => item.value === selectedId)?.label ?? null

  const slots = quote.status === "ready" ? quote.input.slots : {}
  const customerOptions =
    quote.status === "ready" ? quote.input.customerOptions : []

  const quotePicker = (
    <Select
      value={selectedId || null}
      onValueChange={(value) => {
        if (typeof value === "string") setSelectedId(value)
      }}
      disabled={list.status === "loading"}
    >
      <SelectTrigger
        size="sm"
        data-testid="quote-preview-picker"
        aria-label="Quote"
        className="h-7 w-full max-w-xs min-w-0 sm:max-w-sm"
      >
        <SelectValue
          placeholder={
            list.status === "loading" ? "Loading quotes…" : "Select a quote"
          }
        >
          {selectedLabel ?? undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {selectItems.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div
      data-testid="quote-preview-editor"
      className="flex h-full min-h-0 flex-1 flex-col"
    >
      {list.status === "error" ? (
        <p role="alert" className="shrink-0 px-3 py-2 text-sm text-destructive">
          {list.message}
        </p>
      ) : null}

      {quote.status === "error" ? (
        <p role="alert" className="shrink-0 px-3 py-2 text-sm text-destructive">
          {quote.message}
        </p>
      ) : null}

      {quote.status === "ready" ? (
        <QuoteSlotsProvider
          slots={slots}
          components={host.pointComponents ?? NO_COMPONENTS}
        >
          <QuotePreviewPane
            className="min-h-0 flex-1"
            hideHeading
            toolbarStart={quotePicker}
            refreshing={refreshing}
            source={{
              control: form.control,
              quoteId: quote.input.defaultValues.quoteId,
              customerOptions,
              selectedLaneIndex: 0,
              currencyCode: quote.input.defaultValues.currencyCode ?? "",
            }}
            step="route"
          />
        </QuoteSlotsProvider>
      ) : (
        <>
          <div className="flex shrink-0 items-center gap-2 border-b px-2 py-1.5">
            {quotePicker}
          </div>
          {!selectedId ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Choose a quote to preview PDF and email.
            </p>
          ) : null}
          {quote.status === "loading" ? (
            <LoadingState data-testid="quote-preview-loading">
              Loading preview…
            </LoadingState>
          ) : null}
        </>
      )}
    </div>
  )
}

import type {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form"

import type {
  ManualRateLine,
  QuoteFormValues,
  QuoteStatus,
} from "@starboard/lib-contracts"

/**
 * Slots / points `quoting.document` defines (`defines.extensionPoints` in its
 * manifest). Contributors reference these ids in `contributes.points`; the
 * kernel never names them. Types-only contract: contributor packages import
 * from `@starboard/ext-quoting-document/slots` and never the other way round.
 */
export const QUOTING_SLOTS = {
  headerFields: "quoting.slots.headerFields",
  chargeTable: "quoting.slots.chargeTable",
  totals: "quoting.slots.totals",
  rateSources: "quoting.slots.rateSources",
  lifecycle: "quoting.slots.lifecycle",
  preview: "quoting.slots.preview",
  laneRoute: "quoting.slots.laneRoute",
  commands: "quoting.commands",
} as const

export type QuoteSlotId = (typeof QUOTING_SLOTS)[keyof typeof QUOTING_SLOTS]

/** An active contribution as resolved server-side by the extension host. */
export type SlotContribution = {
  id: string
  extensionId: string
  label?: string
  /** UI factory key (defaults to `id`). */
  component?: string
  props?: Record<string, string | number | boolean>
}

/** Active contributions keyed by defined point id (editor-context payload). */
export type QuoteSlotContributions = Record<string, SlotContribution[]>

/** Every slot component also receives the contribution it was mounted for. */
export type SlotComponentProps<P> = P & { contribution: SlotContribution }

type Form = {
  control: Control<QuoteFormValues>
  register: UseFormRegister<QuoteFormValues>
  setValue: UseFormSetValue<QuoteFormValues>
}

export type HeaderFieldsSlotProps = Form & {
  quoteId: string
  errors: FieldErrors<QuoteFormValues>
  /** False for terminal stages (win / loss / expired). */
  commercialEditable: boolean
  /** Layout hint so contributed fields match header density. */
  layout: "desktop" | "tablet" | "mobile"
}

/** Stage / validity / number chrome (self-contributed by quoting.document). */
export type LifecycleSlotProps = Pick<Form, "control" | "register"> & {
  quoteId: string
  status: QuoteStatus
  errors: FieldErrors<QuoteFormValues>
  /** Layout hint so one contribution can adapt density. */
  layout: "desktop" | "tablet" | "mobile"
}

export type PreviewTab = "pdf" | "email"

/**
 * Preview pane body (092 fills PDF / Email). The pane chrome (tabs, document
 * frame, mobile sheet) stays with `quoting.document`; when no contribution is
 * active it renders a stub. `quoteId` is the persisted row UUID used by
 * `/api/quotes/:id`; `quoteNumber` is the human-facing number (display only).
 */
export type PreviewSlotProps = Pick<Form, "control"> & {
  quoteId: string
  quoteNumber: string
  tab: PreviewTab
  /** Active builder step id (`basics` … `build`). */
  step: string
  /** Index of the active lane (steps 2–5), for per-lane previews. */
  selectedLaneIndex: number
  currencyCode: string
}

export type LaneRouteField =
  "origin" | "destination" | "originVia" | "destinationVia"

/**
 * FCL Route step port picker (090). Mounted only for FCL lanes; when no
 * contribution is active (or it throws) the host renders `PortCombobox`
 * fields. Values are soft UNLOCODE strings; Door moves stay host-owned.
 * `geo.gazetteer` mirrors this shape structurally (no import → no cycle).
 */
export type LaneRouteSlotProps = {
  origin: string
  destination: string
  originVia: string
  destinationVia: string
  portOptions: { value: string; label: string }[]
  idPrefix?: string
  onChange: (field: LaneRouteField, value: string) => void
}

/**
 * Toolbar actions (PDF in 083, …). Host always mounts contributions; gate
 * export/destructive actions with `exportAllowed`.
 * `quoteId` is the persisted row UUID used by `/api/quotes/:id` (not the
 * human-facing 6-char number).
 */
export type CommandsSlotProps = {
  quoteId: string
  status: QuoteStatus
  exportAllowed: boolean
}

export type ChargeTableSlotProps = Pick<
  Form,
  "control" | "register" | "setValue"
> & {
  lanePath: `lanes.${number}`
  rateFields: FieldArrayWithId<
    QuoteFormValues,
    `lanes.${number}.manualRates`,
    "id"
  >[]
  currencyCode: string
  excludedBuckets: Array<"origin" | "freight" | "destination">
  onAppendRate: () => void
  onRemoveRate: (index: number) => void
}

export type TotalsSlotProps = Pick<
  Form,
  "control" | "register" | "setValue"
> & {
  lanePath: `lanes.${number}`
  currencyCode: string
  totals: { subtotal: number; markup: number; total: number }
}

export type ApplyRatePayload = {
  line: ManualRateLine
  currencyCode: string
}

export type RateSourcesSlotProps = {
  origin?: string
  destination?: string
  /**
   * The lane's currently selected manual rate (label + amount), so a source
   * can mark the card it applied. Absent / null when none is selected.
   */
  selectedRate?: { label: string; amount: number } | null
  /** Appends the line to the selected lane and selects it. */
  onApplyRate: (payload: ApplyRatePayload) => void
}

import type {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form"

import type { ManualRateLine, QuoteFormValues } from "@starboard/lib-contracts"

/**
 * Slots `quoting.document` defines (`defines.extensionPoints` in its
 * manifest). Contributors reference these ids in `contributes.points`; the
 * kernel never names them. Types-only contract: contributor packages import
 * from `@starboard/ext-quoting-document/slots` and never the other way round.
 */
export const QUOTING_SLOTS = {
  headerFields: "quoting.slots.headerFields",
  chargeTable: "quoting.slots.chargeTable",
  totals: "quoting.slots.totals",
  rateSources: "quoting.slots.rateSources",
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

export type TotalsSlotProps = Pick<Form, "control" | "register"> & {
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
  /** Appends the line to the selected lane and closes the sheet. */
  onApplyRate: (payload: ApplyRatePayload) => void
}

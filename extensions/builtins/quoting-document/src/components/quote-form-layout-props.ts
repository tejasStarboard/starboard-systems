import type {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form"

import type { LiveFxState } from "../lib/use-live-fx"
import type { ApplyRatePayload } from "../slots/types"
import type {
  LaneFormValues,
  QuoteFormOption,
  QuoteFormValues,
} from "../lib/quotes.schema"

export type QuoteFormLayoutProps = {
  quoteId: string
  control: Control<QuoteFormValues>
  register: UseFormRegister<QuoteFormValues>
  setValue: UseFormSetValue<QuoteFormValues>
  errors: FieldErrors<QuoteFormValues>
  customerOptions: QuoteFormOption[]
  currencyOptions: QuoteFormOption[]
  portOptions: QuoteFormOption[]
  containerTypeOptions: QuoteFormOption[]
  palletTypeOptions: QuoteFormOption[]
  laneFields: FieldArrayWithId<QuoteFormValues, "lanes", "id">[]
  lanes: LaneFormValues[] | undefined
  selectedLane: LaneFormValues | undefined
  selectedLaneIndex: number
  selectedLaneId: string | undefined
  lanePath: `lanes.${number}`
  laneReady: boolean
  rateFields: FieldArrayWithId<
    QuoteFormValues,
    `lanes.${number}.manualRates`,
    "id"
  >[]
  manualRatesVisible: boolean
  totals: { subtotal: number; markup: number; total: number }
  excludedBuckets: Array<"origin" | "freight" | "destination">
  currencyCode: string
  /** Live FX (Frankfurter) status for the Rate-step base currency. */
  fx: LiveFxState
  pending: boolean
  isDirty: boolean
  /** False for terminal stages (win / loss / expired). */
  commercialEditable: boolean
  onSelectLane: (index: number) => void
  onAddLane: () => void
  onRemoveLane: (index: number) => void
  onApplyRate: (payload: ApplyRatePayload) => void
  onAddManualRate: () => void
  onAppendRate: () => void
  onRemoveRate: (index: number) => void
  onCancel: () => void
  /** Opens the standalone `quote.preview` center tab (status bar surface). */
  onOpenPreview?: () => void
}

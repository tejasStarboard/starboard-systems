import type {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form"

import type {
  LaneFormValues,
  QuoteFormOption,
  QuoteFormValues,
} from "@/lib/domain/quotes.schema"

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
  currencyCode: string
  pending: boolean
  isDirty: boolean
  onSelectLane: (index: number) => void
  onAddLane: () => void
  onRemoveLane: (index: number) => void
  onSearchRates: () => void
  onAddManualRate: () => void
  onAppendRate: () => void
  onRemoveRate: (index: number) => void
  onCancel: () => void
}

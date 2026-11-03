import type { ComponentType } from "react"

import { RateEditor } from "./editors/rate-editor"
import { RateSearchEditor } from "./editors/rate-search-editor"
import { RateSheetsEditor } from "./editors/rate-sheets-editor"
import { RatesPlaceholderEditor } from "./editors/rates-placeholder-editor"
import type { BuiltinEditorProps } from "./host"
import { CatalogSource } from "./slots/catalog-source"
import { SpotSource } from "./slots/spot-source"
import { UploadRatesAction } from "./slots/upload-rates-action"

export { manifest, type BuiltinManifest } from "./manifest"
export type { BuiltinEditorProps, BuiltinHost, BuiltinViewProps } from "./host"
export {
  IngestActionsSlot,
  RATES_INGEST_ACTIONS_POINT,
} from "./slots/ingest-actions"

/** Editor factories keyed by contributed `workbench.editors` viewType. */
export const editors: Readonly<
  Record<
    "rate" | "rate.search" | "rate.sheets" | "rate.sell" | "rate.spotSearch",
    ComponentType<BuiltinEditorProps>
  >
> = {
  rate: RateEditor,
  "rate.search": RateSearchEditor,
  "rate.sheets": RateSheetsEditor,
  "rate.sell": RatesPlaceholderEditor,
  "rate.spotSearch": RatesPlaceholderEditor,
}

/** No sidebar view factories: the contributed view is a static entry list. */
export const views = {} as const

/**
 * UI factories keyed by contribution id / `component` key.
 * - `rates.spotSource` — optional `spot.*` workers into rateSources
 * - `rates.ingestUpload` — optional `ingestion.*` into ingestActions
 */
export const pointComponents: Readonly<
  Record<
    "rates.catalog.source" | "rates.spotSource" | "rates.ingestUpload",
    ComponentType<never>
  >
> = {
  "rates.catalog.source": CatalogSource as ComponentType<never>,
  "rates.spotSource": SpotSource as ComponentType<never>,
  "rates.ingestUpload": UploadRatesAction as ComponentType<never>,
}

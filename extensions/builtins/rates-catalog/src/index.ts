import type { ComponentType } from "react"

import { CatalogSource } from "./slots/catalog-source"
import { SpotSource } from "./slots/spot-source"

export { manifest, type BuiltinManifest } from "./manifest"

/**
 * UI factories keyed by contribution id / `component` key. `rates.spotSource`
 * is the shared panel optional `spot.*` workers reference via `component`.
 */
export const pointComponents: Readonly<
  Record<"rates.catalog.source" | "rates.spotSource", ComponentType<never>>
> = {
  "rates.catalog.source": CatalogSource as ComponentType<never>,
  "rates.spotSource": SpotSource as ComponentType<never>,
}

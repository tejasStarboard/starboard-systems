import type { ComponentType } from "react"

import { AddressCombobox } from "./components/address-combobox"
import { CurrencyCombobox } from "./components/currency-combobox"
import { PortCombobox } from "./components/port-combobox"
import { RouteMapFields } from "./components/route-map-fields"

export { manifest, type BuiltinManifest } from "./manifest"
export { AddressCombobox, CurrencyCombobox, PortCombobox, RouteMapFields }
export type { ComboboxOption, PortOption } from "./lib/options"
export type {
  RouteMapField,
  RouteMapFieldsProps,
} from "./components/route-map-fields"

/** Widget factories consumed by quote (and later contributed into quote-defined slots). */
export const widgets = {
  PortCombobox,
  AddressCombobox,
  CurrencyCombobox,
} as const

/**
 * UI factories for contributions into `quoting.document` points, keyed by
 * contribution id. Kernel merges into `builtinPointComponents`.
 */
export const pointComponents: Readonly<
  Record<"geo.gazetteer.routeMap", ComponentType<never>>
> = {
  "geo.gazetteer.routeMap": RouteMapFields as ComponentType<never>,
}

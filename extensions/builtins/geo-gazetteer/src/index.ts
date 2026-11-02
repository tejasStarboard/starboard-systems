import { AddressCombobox } from "./components/address-combobox"
import { PortCombobox } from "./components/port-combobox"

export { manifest, type BuiltinManifest } from "./manifest"
export { AddressCombobox, PortCombobox }
export type { ComboboxOption } from "./lib/options"

/** Widget factories consumed by quote (and later contributed into quote-defined slots). */
export const widgets = {
  PortCombobox,
  AddressCombobox,
} as const

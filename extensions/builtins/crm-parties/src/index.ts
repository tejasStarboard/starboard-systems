import type { ComponentType } from "react"

import { CustomerCombobox } from "./components/customer-combobox"
import { CustomerEditor } from "./editors/customer-editor"
import { CustomerListEditor } from "./editors/customer-list-editor"
import type { BuiltinEditorProps } from "./host"

export { manifest, type BuiltinManifest } from "./manifest"
export type { BuiltinEditorProps, BuiltinHost, BuiltinViewProps } from "./host"
export { CustomerCombobox }
export type { ComboboxOption } from "./lib/options"

/** Editor factories keyed by contributed `workbench.editors` viewType. */
export const editors: Readonly<
  Record<"customer" | "customer.list", ComponentType<BuiltinEditorProps>>
> = {
  customer: CustomerEditor,
  "customer.list": CustomerListEditor,
}

/** No sidebar view factories: the contributed view is a static entry list. */
export const views = {} as const

/** Widget factories consumed by quote (and later contributed into quote slots). */
export const widgets = { CustomerCombobox } as const

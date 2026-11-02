import type { ComponentType } from "react"

import { QuoteListView } from "./components/quote-list-view"
import { QuoteEditor } from "./editors/quote-editor"
import { QuoteListEditor } from "./editors/quote-list-editor"
import type { BuiltinEditorProps, BuiltinViewProps } from "./host"

export { manifest, type BuiltinManifest } from "./manifest"
export type { BuiltinEditorProps, BuiltinHost, BuiltinViewProps } from "./host"

/**
 * Editor factories keyed by contributed `workbench.editors` viewType.
 * The web shell resolves these generically (no per-id branching).
 */
export const editors: Readonly<
  Record<"quote" | "quote.list", ComponentType<BuiltinEditorProps>>
> = {
  quote: QuoteEditor,
  "quote.list": QuoteListEditor,
}

/** Sidebar view factories keyed by contributed `workbench.views` id. */
export const views: Readonly<
  Record<"quoting.document.list", ComponentType<BuiltinViewProps>>
> = {
  "quoting.document.list": QuoteListView,
}

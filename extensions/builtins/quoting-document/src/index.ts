import type { ComponentType } from "react"

import { QuoteListView } from "./components/quote-list-view"
import { QuoteEditor } from "./editors/quote-editor"
import { QuoteListEditor } from "./editors/quote-list-editor"
import { QuotePreviewEditor } from "./editors/quote-preview-editor"
import type { BuiltinEditorProps, BuiltinViewProps } from "./host"
import { LifecycleChrome } from "./slots/lifecycle-chrome"

export { manifest, type BuiltinManifest } from "./manifest"
export type { BuiltinEditorProps, BuiltinHost, BuiltinViewProps } from "./host"
export {
  newTabCommands,
  type NewTabCommandContext,
  type NewTabCommandHandler,
} from "./new-tab-commands"
export { PREVIEW_EMPTY_RESOURCE } from "./editors/quote-preview-editor"

/**
 * Editor factories keyed by contributed `workbench.editors` viewType.
 * The web shell resolves these generically (no per-id branching).
 */
export const editors: Readonly<
  Record<
    "quote" | "quote.list" | "quote.preview",
    ComponentType<BuiltinEditorProps>
  >
> = {
  quote: QuoteEditor,
  "quote.list": QuoteListEditor,
  "quote.preview": QuotePreviewEditor,
}

/** Sidebar view factories keyed by contributed `workbench.views` id. */
export const views: Readonly<
  Record<"quoting.document.list", ComponentType<BuiltinViewProps>>
> = {
  "quoting.document.list": QuoteListView,
}

/**
 * UI factories for this extension's contributions into its own slots, keyed by
 * contribution id. The kernel merges every package's `pointComponents`.
 */
export const pointComponents: Readonly<
  Record<"quoting.document.lifecycle", ComponentType<never>>
> = {
  "quoting.document.lifecycle": LifecycleChrome as ComponentType<never>,
}

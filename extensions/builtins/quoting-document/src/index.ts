import { QuoteEditorStub } from "./quote-editor-stub"

export { manifest, type BuiltinManifest } from "./manifest"
export { QuoteEditorStub, type BuiltinEditorProps } from "./quote-editor-stub"

/**
 * Editor factories keyed by contributed `workbench.editors` viewType.
 * The web shell resolves these generically (no per-id branching).
 */
export const editors = {
  "quote.stub": QuoteEditorStub,
} as const

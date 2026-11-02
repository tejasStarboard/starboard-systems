import type { ComponentType } from "react"

import {
  editors as quotingDocumentEditors,
  views as quotingDocumentViews,
  type BuiltinEditorProps,
  type BuiltinHost,
  type BuiltinViewProps,
} from "@starboard/ext-quoting-document"

export type { BuiltinHost }

/** Props the editor host passes to a built-in editor factory. */
export type BuiltinEditorComponent = ComponentType<BuiltinEditorProps>

/** Props the sidebar host passes to a built-in view factory. */
export type BuiltinViewComponent = ComponentType<BuiltinViewProps>

/**
 * Composition root for extension-provided UI. The kernel resolves by contributed
 * `workbench.editors` viewType / `workbench.views` id only (and only when the
 * host actually contributed it — unplug = no render). Add a package's
 * `editors` / `views` maps here when it ships real UI.
 */
export const builtinEditors: Readonly<Record<string, BuiltinEditorComponent>> =
  {
    ...quotingDocumentEditors,
  }

export const builtinViews: Readonly<Record<string, BuiltinViewComponent>> = {
  ...quotingDocumentViews,
}

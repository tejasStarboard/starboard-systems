import type { ComponentType } from "react"

import { editors as quotingDocumentEditors } from "@starboard/ext-quoting-document"

/** Props the editor host passes to a built-in editor factory. */
export type BuiltinEditorComponent = ComponentType<{
  resourceId: string
  title: string
}>

/**
 * Composition root for extension-provided editors, keyed by contributed
 * `workbench.editors` viewType. The kernel resolves by viewType only (and only
 * when the host actually contributed that editor — unplug = no render).
 * Add a package's `editors` map here when it ships real editors.
 */
export const builtinEditors: Readonly<Record<string, BuiltinEditorComponent>> =
  {
    ...quotingDocumentEditors,
  }

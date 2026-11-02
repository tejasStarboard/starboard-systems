import type { ComponentType } from "react"

export type SlotContribution = {
  id: string
  label?: string
  component?: string
  props?: Record<string, string | number | boolean>
  extensionId?: string
}

/**
 * Contract between the workbench hosts (kernel) and `rates.catalog` UI.
 * The kernel passes this in; the package never imports kernel / Next modules.
 */
export type BuiltinHost = {
  /** Open (or focus) an editor tab contributed by any active extension. */
  openEditor: (input: {
    viewType: string
    resourceId: string
    title?: string
  }) => void
  /** Currently focused editor tab, if any (sidebar highlight). */
  activeEditor: { viewType: string; resourceId: string } | null
  /**
   * UI factories contributed by active extensions into extension-defined
   * points, keyed by contribution id / `component`.
   */
  pointComponents?: Readonly<Record<string, ComponentType<never>>>
  /**
   * Active contributions to extension-defined points, keyed by point id
   * (e.g. `rates.slots.ingestActions`). Empty / missing = fail closed.
   */
  slots?: Readonly<Record<string, readonly SlotContribution[]>>
}

/** Props every built-in editor factory receives from the workbench editor host. */
export type BuiltinEditorProps = {
  resourceId: string
  title: string
  host: BuiltinHost
}

/** Props every built-in sidebar view factory receives from the sidebar host. */
export type BuiltinViewProps = {
  host: BuiltinHost
}

import type { SlotComponentRegistry } from "./slots/slot-host"

/**
 * Contract between the workbench hosts (kernel) and `quoting.document` UI.
 * The kernel passes this in; the package never imports kernel / Next modules.
 */
export type BuiltinHost = {
  /** Open (or focus) an editor tab contributed by any active extension. */
  openEditor: (input: {
    viewType: string
    resourceId: string
    title?: string
    /** Open in the right split pane (creates the horizontal split). */
    side?: "beside"
  }) => void
  /** Rename the focused editor tab (e.g. short quote id after load). */
  setEditorTitle?: (title: string) => void
  /** Currently focused editor tab, if any (sidebar highlight). */
  activeEditor: { viewType: string; resourceId: string } | null
  /**
   * UI factories contributed by active extensions into extension-defined
   * points, keyed by contribution id / `component`. Generic: the kernel merges
   * every package's `pointComponents` and never names slots.
   */
  pointComponents?: SlotComponentRegistry
  /**
   * Active contributions to extension-defined points, keyed by point id.
   * Optional; quote editors prefer editor-context `slots` instead.
   */
  slots?: Readonly<
    Record<
      string,
      readonly {
        id: string
        label?: string
        component?: string
        props?: Record<string, string | number | boolean>
        extensionId?: string
      }[]
    >
  >
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

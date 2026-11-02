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
  }) => void
  /** Currently focused editor tab, if any (sidebar highlight). */
  activeEditor: { viewType: string; resourceId: string } | null
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

import type { ComponentType } from "react"

import { SettingsEditor } from "./editors/settings-editor"
import { SettingsIndexEditor } from "./editors/settings-index-editor"
import type { BuiltinEditorProps } from "./host"

export { manifest, type BuiltinManifest } from "./manifest"
export type { BuiltinEditorProps, BuiltinHost, BuiltinViewProps } from "./host"
export { SETTINGS_PAGES } from "./lib/settings-pages"
export type { SettingsContext } from "./lib/settings-context"

/** Editor factories keyed by contributed `workbench.editors` viewType. */
export const editors: Readonly<
  Record<"settings" | "settings.index", ComponentType<BuiltinEditorProps>>
> = {
  settings: SettingsEditor,
  "settings.index": SettingsIndexEditor,
}

/** No sidebar view factories: the contributed view is a static entry list. */
export const views = {} as const

/** No widgets yet. */
export const widgets = {} as const

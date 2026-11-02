"use client"

import { SettingsIndex } from "../components/settings-index"
import type { BuiltinEditorProps } from "../host"

/** `settings.index` editor: the settings overview (formerly `/settings`). */
export function SettingsIndexEditor({ host }: BuiltinEditorProps) {
  return <SettingsIndex host={host} />
}

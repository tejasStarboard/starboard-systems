import type { ExtensionManifest } from "./manifest.js"
import {
  settingValueMessage,
  type ExtensionSettingContribution,
  type ExtensionSettingType,
} from "./manifest.js"

export type StoredExtensionSetting = {
  key: string
  value: unknown
}

export type SettingScalar = boolean | string | number | null

export type StaffSettingView = {
  key: string
  label: string
  description?: string
  type: ExtensionSettingType
  scope: "platform"
  required: boolean
  value?: SettingScalar
  configured?: boolean
}

export function getDeclaredSettings(
  manifest: ExtensionManifest
): ExtensionSettingContribution[] {
  return manifest.contributes.settings ?? []
}

export function validateSettingValues(
  declarations: ExtensionSettingContribution[],
  values: Record<string, unknown>
):
  | { ok: true; entries: Array<{ key: string; value: SettingScalar }> }
  | { ok: false; message: string } {
  const byKey = new Map(declarations.map((setting) => [setting.key, setting]))
  const entries: Array<{ key: string; value: SettingScalar }> = []

  for (const [key, value] of Object.entries(values)) {
    const setting = byKey.get(key)
    if (!setting) {
      return { ok: false, message: `Unknown setting "${key}"` }
    }
    if (value === null || value === undefined) {
      return { ok: false, message: `Invalid value for "${key}"` }
    }
    const message = settingValueMessage(setting.type, value, setting.options)
    if (message) {
      return { ok: false, message: `${message} for "${key}"` }
    }
    if (setting.required && value === "") {
      return { ok: false, message: `"${key}" is required` }
    }
    entries.push({ key, value: value as SettingScalar })
  }

  return { ok: true, entries }
}

export function resolveStaffSettings(
  declarations: ExtensionSettingContribution[],
  stored: StoredExtensionSetting[]
): StaffSettingView[] {
  const storedByKey = new Map(stored.map((row) => [row.key, row.value]))

  return declarations.map((setting) => {
    const hasRow = storedByKey.has(setting.key)
    const base = {
      key: setting.key,
      label: setting.label,
      ...(setting.description ? { description: setting.description } : {}),
      type: setting.type,
      scope: setting.scope,
      required: setting.required ?? false,
    }

    if (setting.type === "secret") {
      return { ...base, configured: hasRow }
    }

    return {
      ...base,
      value: effectiveValue(setting, hasRow, storedByKey.get(setting.key)),
    }
  })
}

/** Server-side read path, including stored secrets. Missing rows use the manifest default. */
export function resolveExtensionSettingValues(
  declarations: ExtensionSettingContribution[],
  stored: StoredExtensionSetting[]
): Record<string, SettingScalar> {
  const storedByKey = new Map(stored.map((row) => [row.key, row.value]))
  const resolved: Record<string, SettingScalar> = {}

  for (const setting of declarations) {
    const hasRow = storedByKey.has(setting.key)
    resolved[setting.key] = effectiveValue(
      setting,
      hasRow,
      storedByKey.get(setting.key)
    )
  }

  return resolved
}

function effectiveValue(
  setting: ExtensionSettingContribution,
  hasRow: boolean,
  storedValue: unknown
): SettingScalar {
  if (
    hasRow &&
    storedValue !== null &&
    settingValueMessage(setting.type, storedValue, setting.options) === null
  ) {
    return storedValue as SettingScalar
  }
  if (setting.default === undefined) {
    return null
  }
  return setting.default
}

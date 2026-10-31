import type { StaffSettingView } from "@starboard/ext-host"

export type SettingFormField = {
  key: string
  label: string
  description?: string
  type: StaffSettingView["type"]
  required: boolean
  options?: Array<{ value: string; label: string }>
  booleanValue: boolean
  textValue: string
  configured: boolean
  secretDirty: boolean
}

export function fieldsFromStaffSettings(
  settings: StaffSettingView[]
): SettingFormField[] {
  return settings.map((setting) => ({
    key: setting.key,
    label: setting.label,
    description: setting.description,
    type: setting.type,
    required: setting.required,
    options: setting.options,
    booleanValue: setting.value === true,
    textValue:
      setting.type === "secret" || setting.value == null
        ? ""
        : String(setting.value),
    configured: setting.configured === true,
    secretDirty: false,
  }))
}

export function buildExtensionSettingValues(
  fields: SettingFormField[]
):
  | { ok: true; values: Record<string, boolean | string | number> }
  | { ok: false; message: string } {
  const values: Record<string, boolean | string | number> = {}

  for (const field of fields) {
    if (field.type === "boolean") {
      values[field.key] = field.booleanValue
      continue
    }

    if (field.type === "secret") {
      if (!field.secretDirty || field.textValue === "") {
        continue
      }
      values[field.key] = field.textValue
      continue
    }

    if (field.type === "number") {
      const parsed = Number(field.textValue)
      if (field.textValue.trim() === "" || !Number.isFinite(parsed)) {
        return {
          ok: false,
          message: `Expected a number for "${field.key}"`,
        }
      }
      values[field.key] = parsed
      continue
    }

    values[field.key] = field.textValue
  }

  return { ok: true, values }
}

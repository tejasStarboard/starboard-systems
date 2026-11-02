import type { ExtensionSettingContribution } from "@starboard/ext-host"

import {
  decryptSecret,
  encryptSecret,
  isSecretEnvelope,
} from "@/lib/crypto/extension-secret"

export const CARRIER_EXTENSION_IDS = ["spot.maersk", "spot.cma"] as const

export type CarrierExtensionId = (typeof CARRIER_EXTENSION_IDS)[number]

export function isCarrierExtensionId(
  extensionId: string
): extensionId is CarrierExtensionId {
  return (CARRIER_EXTENSION_IDS as readonly string[]).includes(extensionId)
}

export function organizationScopedSettings(
  declarations: ExtensionSettingContribution[]
): ExtensionSettingContribution[] {
  return declarations.filter((setting) => setting.scope === "organization")
}

export function missingRequiredSecrets(
  declarations: ExtensionSettingContribution[],
  storedKeys: ReadonlySet<string>,
  incoming: Record<string, unknown>
): string | null {
  for (const setting of organizationScopedSettings(declarations)) {
    if (setting.type !== "secret" || !setting.required) {
      continue
    }
    const incomingValue = incoming[setting.key]
    const provided =
      typeof incomingValue === "string" && incomingValue.trim() !== ""
    if (!storedKeys.has(setting.key) && !provided) {
      return `"${setting.key}" is required`
    }
  }
  return null
}

export function sealSettingEntries(
  declarations: ExtensionSettingContribution[],
  entries: Array<{ key: string; value: boolean | string | number | null }>,
  secret: string
): Array<{ key: string; value: unknown }> {
  const byKey = new Map(declarations.map((setting) => [setting.key, setting]))
  return entries.map((entry) => {
    const setting = byKey.get(entry.key)
    if (setting?.type === "secret" && typeof entry.value === "string") {
      return { key: entry.key, value: encryptSecret(entry.value, secret) }
    }
    return entry
  })
}

export function openSecretValues(
  declarations: ExtensionSettingContribution[],
  stored: Array<{ key: string; value: unknown }>,
  secret: string
): Record<string, string> {
  const byKey = new Map(declarations.map((setting) => [setting.key, setting]))
  const opened: Record<string, string> = {}
  for (const row of stored) {
    const setting = byKey.get(row.key)
    if (setting?.type !== "secret") {
      continue
    }
    const plain = readSecret(row.value, secret)
    if (plain && plain.trim()) {
      opened[row.key] = plain
    }
  }
  return opened
}

export function materializeSettingRows<
  T extends { key: string; value: unknown },
>(
  declarations: ExtensionSettingContribution[],
  stored: T[],
  secret: string
): T[] {
  const byKey = new Map(declarations.map((setting) => [setting.key, setting]))
  return stored.map((row) => {
    const setting = byKey.get(row.key)
    if (setting?.type !== "secret") {
      return row
    }
    return { ...row, value: readSecret(row.value, secret) }
  })
}

function readSecret(value: unknown, secret: string): string | null {
  if (typeof value === "string") {
    return value
  }
  if (!isSecretEnvelope(value)) {
    return null
  }
  try {
    return decryptSecret(value, secret)
  } catch {
    return null
  }
}

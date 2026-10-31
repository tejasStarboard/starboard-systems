import { getDeclaredSettings, listManifests } from "@starboard/ext-host"

type SettingScalar = boolean | string | number | null

/** Non-secret settings safe to put on Temporal job input / logs. */
export function settingsForJobInput(
  extensionId: string,
  resolved: Record<string, SettingScalar>
): Record<string, SettingScalar> {
  const manifest = listManifests().find((item) => item.id === extensionId)
  if (!manifest) {
    return {}
  }
  const secretKeys = new Set(
    getDeclaredSettings(manifest)
      .filter((setting) => setting.type === "secret")
      .map((setting) => setting.key)
  )
  const out: Record<string, SettingScalar> = {}
  for (const [key, value] of Object.entries(resolved)) {
    if (secretKeys.has(key)) {
      continue
    }
    out[key] = value
  }
  return out
}

export function liveStrategyEnabled(
  settings: Record<string, SettingScalar>
): boolean {
  return settings.live_strategy === true
}

export function syncIntervalMinutes(
  settings: Record<string, SettingScalar>,
  fallback = 15
): number {
  const value = settings.sync_interval_minutes
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback
}

/** Spot job fields derived from resolved admin settings (no secrets). */
export function spotJobSettingsFromResolved(
  extensionId: string,
  resolved: Record<string, SettingScalar>
): { liveStrategy?: boolean } {
  const jobSettings = settingsForJobInput(extensionId, resolved)
  if (!("live_strategy" in jobSettings)) {
    return {}
  }
  return { liveStrategy: liveStrategyEnabled(jobSettings) }
}

/** Messaging sync job fields derived from resolved admin settings. */
export function messagingJobSettingsFromResolved(
  extensionId: string,
  resolved: Record<string, SettingScalar>
): { syncIntervalMinutes: number } {
  return {
    syncIntervalMinutes: syncIntervalMinutes(
      settingsForJobInput(extensionId, resolved)
    ),
  }
}

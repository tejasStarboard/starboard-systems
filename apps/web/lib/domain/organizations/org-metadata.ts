export type QuoteRulesPreferences = {
  defaultValidityDays: number
}

export type OrgWorkspaceMetadata = {
  quoteRules?: QuoteRulesPreferences
}

export function parseOrgMetadata(raw: unknown): OrgWorkspaceMetadata {
  if (raw == null) return {}
  let value: unknown = raw
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw)
    } catch {
      return {}
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }
  const quoteRules = (value as { quoteRules?: unknown }).quoteRules
  if (!quoteRules || typeof quoteRules !== "object") {
    return value as OrgWorkspaceMetadata
  }
  const days = (quoteRules as { defaultValidityDays?: unknown })
    .defaultValidityDays
  if (typeof days !== "number" || !Number.isFinite(days) || days < 1) {
    return { ...(value as OrgWorkspaceMetadata), quoteRules: undefined }
  }
  return {
    ...(value as OrgWorkspaceMetadata),
    quoteRules: { defaultValidityDays: Math.floor(days) },
  }
}

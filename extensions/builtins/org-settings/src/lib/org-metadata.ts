export type QuoteRulesPreferences = {
  defaultValidityDays?: number
  /** ISO-4217 code applied to new / blank-currency quote drafts. */
  defaultBaseCurrency?: string
}

export type OrgWorkspaceMetadata = {
  quoteRules?: QuoteRulesPreferences
}

function parseQuoteRules(raw: unknown): QuoteRulesPreferences | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined
  const { defaultValidityDays, defaultBaseCurrency } = raw as {
    defaultValidityDays?: unknown
    defaultBaseCurrency?: unknown
  }
  const rules: QuoteRulesPreferences = {}
  if (
    typeof defaultValidityDays === "number" &&
    Number.isFinite(defaultValidityDays) &&
    defaultValidityDays >= 1
  ) {
    rules.defaultValidityDays = Math.floor(defaultValidityDays)
  }
  if (
    typeof defaultBaseCurrency === "string" &&
    /^[A-Za-z]{3}$/.test(defaultBaseCurrency.trim())
  ) {
    rules.defaultBaseCurrency = defaultBaseCurrency.trim().toUpperCase()
  }
  return Object.keys(rules).length > 0 ? rules : undefined
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
  return {
    ...(value as OrgWorkspaceMetadata),
    quoteRules: parseQuoteRules((value as { quoteRules?: unknown }).quoteRules),
  }
}

/** Org default base currency for new quotes (`null` when unset / invalid). */
export function orgDefaultBaseCurrency(raw: unknown): string | null {
  return parseOrgMetadata(raw).quoteRules?.defaultBaseCurrency ?? null
}

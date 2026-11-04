import { z } from "zod"

/**
 * Static ISO-4217 subset: the Frankfurter (ECB) set plus freight-relevant
 * extras. Seeds `geo.currency` so fresh orgs have a usable list; codes outside
 * the Frankfurter set simply have no live rate (missing-FX affordance applies).
 */
export const ISO_CURRENCIES: ReadonlyArray<{ code: string; name: string }> = [
  { code: "AED", name: "UAE Dirham" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "BGN", name: "Bulgarian Lev" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "COP", name: "Colombian Peso" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "DKK", name: "Danish Krone" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "ILS", name: "Israeli Shekel" },
  { code: "INR", name: "Indian Rupee" },
  { code: "ISK", name: "Icelandic Krona" },
  { code: "JOD", name: "Jordanian Dinar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "KRW", name: "South Korean Won" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "LKR", name: "Sri Lankan Rupee" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "OMR", name: "Omani Rial" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "RON", name: "Romanian Leu" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "THB", name: "Thai Baht" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "TWD", name: "New Taiwan Dollar" },
  { code: "USD", name: "US Dollar" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "ZAR", name: "South African Rand" },
]

const ISO_NAMES: ReadonlyMap<string, string> = new Map(
  ISO_CURRENCIES.map((entry) => [entry.code, entry.name])
)

/** `USD — US Dollar` when the name is known, else the bare code. */
export function currencyLabel(
  code: string,
  names?: Readonly<Record<string, string>>
): string {
  const normalized = code.trim().toUpperCase()
  const name = names?.[normalized] ?? ISO_NAMES.get(normalized)
  return name ? `${normalized} — ${name}` : normalized
}

/** `GET /fx/latest` (geography) / `GET /api/geography/fx` (BFF). */
export const fxLatestResponseSchema = z.object({
  /** Quote base currency the rates are expressed from (1 base = rate × code). */
  base: z.string(),
  /** Provider publication date (ECB business day), `YYYY-MM-DD`. */
  date: z.string(),
  rates: z.record(z.string(), z.number()),
  provider: z.literal("frankfurter"),
})

export type FxLatestResponse = z.infer<typeof fxLatestResponseSchema>

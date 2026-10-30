import { and, eq } from "drizzle-orm"
import { currency, quote } from "@starboard/db/schema"

import { db } from "@/lib/db"
import {
  quoteFormSchema,
  type QuoteFormValues,
  type QuoteSource,
} from "@/lib/quotes/schema"

const SHORT_QUOTE_ID_LENGTH = 6
const SHORT_QUOTE_ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const SHORT_QUOTE_ID_MAX_ATTEMPTS = 32

export function createQuoteId() {
  return crypto.randomUUID()
}

function generateAlphanumericQuoteId(length = SHORT_QUOTE_ID_LENGTH) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let result = ""

  for (const byte of bytes) {
    result += SHORT_QUOTE_ID_ALPHABET[byte % SHORT_QUOTE_ID_ALPHABET.length]
  }

  return result
}

export async function createShortQuoteId(organizationId: string) {
  for (let attempt = 0; attempt < SHORT_QUOTE_ID_MAX_ATTEMPTS; attempt++) {
    const candidate = generateAlphanumericQuoteId()
    const [existing] = await db
      .select({ id: quote.id })
      .from(quote)
      .where(
        and(
          eq(quote.organizationId, organizationId),
          eq(quote.quoteId, candidate)
        )
      )
      .limit(1)

    if (!existing) {
      return candidate
    }
  }

  throw new Error("Unable to generate a unique quote ID for this organization")
}

export async function ensureCurrency(code: string) {
  await db
    .insert(currency)
    .values({ code })
    .onConflictDoNothing({ target: currency.code })
}

function parseOptionalDate(value: string | undefined) {
  if (!value?.trim()) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function createQuote(input: {
  ownerId: string
  organizationId: string
  customerId?: string | null
  source?: QuoteSource
  currencyCode?: string | null
}) {
  const id = createQuoteId()
  const currencyCode = input.currencyCode?.trim().toUpperCase() || null
  const quoteId = await createShortQuoteId(input.organizationId)

  if (currencyCode) {
    await ensureCurrency(currencyCode)
  }

  await db.insert(quote).values({
    id,
    source: input.source ?? "manual",
    status: "draft",
    ownerId: input.ownerId,
    organizationId: input.organizationId,
    quoteId,
    customerId: input.customerId || null,
    effectiveFrom: null,
    expiryAt: null,
    currencyCode,
  })

  return { id }
}

export async function saveQuote(
  values: QuoteFormValues,
  input: { ownerId: string; organizationId: string }
): Promise<
  | { ok: true; quote: { id: string } }
  | { ok: false; error: string; status: 400 }
> {
  const parsed = quoteFormSchema.safeParse(values)

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid quote",
      status: 400,
    }
  }

  const data = parsed.data
  const currencyCode = data.currencyCode.trim().toUpperCase() || null

  if (currencyCode) {
    await ensureCurrency(currencyCode)
  }

  const [existing] = await db
    .select({ id: quote.id, quoteId: quote.quoteId })
    .from(quote)
    .where(eq(quote.id, data.id))
    .limit(1)

  const payload = {
    status: data.status,
    customerId: data.customerId.trim() || null,
    effectiveFrom: parseOptionalDate(data.effectiveFrom),
    expiryAt: parseOptionalDate(data.expiryAt),
    currencyCode,
  }

  if (!existing) {
    await db.insert(quote).values({
      id: data.id,
      source: data.source || "manual",
      ownerId: input.ownerId,
      organizationId: input.organizationId,
      quoteId: data.quoteId || (await createShortQuoteId(input.organizationId)),
      ...payload,
    })
  } else {
    await db.update(quote).set(payload).where(eq(quote.id, data.id))
  }

  return { ok: true, quote: { id: data.id } }
}

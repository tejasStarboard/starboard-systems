import { asc } from "drizzle-orm"
import { currency } from "@starboard/db/schema"
import type { FormOption } from "@starboard/contracts"

import type { GeographyDb } from "./db"

export interface GeographyDao {
  ensureCurrency(code: string): Promise<string>
  listCurrencies(): Promise<FormOption[]>
}

export class DrizzleGeographyDao implements GeographyDao {
  constructor(private readonly db: GeographyDb) {}

  async ensureCurrency(code: string): Promise<string> {
    const normalized = code.trim().toUpperCase()
    await this.db
      .insert(currency)
      .values({ code: normalized })
      .onConflictDoNothing({ target: currency.code })
    return normalized
  }

  async listCurrencies(): Promise<FormOption[]> {
    const rows = await this.db
      .select({ code: currency.code })
      .from(currency)
      .orderBy(asc(currency.code))

    return rows.map((row) => ({
      value: row.code,
      label: row.code,
    }))
  }
}

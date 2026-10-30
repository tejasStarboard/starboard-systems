import { asc, eq, ilike } from "drizzle-orm"
import { country, currency, port } from "@starboard/db/schema"
import type { FormOption } from "@starboard/contracts"

import type { GeographyDb } from "./db"

const PORT_SEARCH_LIMIT = 50

export interface GeographyDao {
  ensureCurrency(code: string): Promise<string>
  listCurrencies(): Promise<FormOption[]>
  searchPorts(q: string): Promise<FormOption[]>
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

  async searchPorts(q: string): Promise<FormOption[]> {
    const prefix = q.trim().toUpperCase()
    const base = this.db
      .select({
        unlocode: port.unlocode,
        countryName: country.name,
      })
      .from(port)
      .innerJoin(country, eq(port.countryId, country.id))

    const rows =
      prefix.length > 0
        ? await base
            .where(ilike(port.unlocode, `${prefix}%`))
            .orderBy(asc(port.unlocode))
            .limit(PORT_SEARCH_LIMIT)
        : await base.orderBy(asc(port.unlocode)).limit(PORT_SEARCH_LIMIT)

    return rows.map((row) => ({
      value: row.unlocode,
      label: `${row.unlocode} — ${row.countryName}`,
    }))
  }
}

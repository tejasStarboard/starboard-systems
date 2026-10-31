import { asc, desc, ilike, or, sql } from "drizzle-orm"
import { currency, facility } from "@starboard/db/schema"
import type { FacilityOption, FormOption } from "@starboard/contracts"

import type { GeographyDb } from "./db"

const PORT_SEARCH_LIMIT = 50

export interface GeographyDao {
  ensureCurrency(code: string): Promise<string>
  listCurrencies(): Promise<FormOption[]>
  searchPorts(q: string): Promise<FacilityOption[]>
}

function toFacilityOption(row: {
  unlocode: string | null
  iata: string | null
  name: string
  facilityTypes: string[]
  countryCode: string
}): FacilityOption {
  const value = (row.unlocode ?? row.iata ?? "").toUpperCase()
  return {
    value,
    label: `${value} — ${row.name}`,
    types: row.facilityTypes,
    country: row.countryCode,
  }
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

  async searchPorts(q: string): Promise<FacilityOption[]> {
    const trimmed = q.trim()
    const prefix = trimmed.toUpperCase()
    const namePattern = `%${trimmed}%`

    const base = this.db
      .select({
        unlocode: facility.unlocode,
        iata: facility.iata,
        name: facility.name,
        facilityTypes: facility.facilityTypes,
        countryCode: facility.countryCode,
        isPrimary: facility.isPrimary,
      })
      .from(facility)

    const rows =
      prefix.length > 0
        ? await base
            .where(
              or(
                ilike(facility.unlocode, `${prefix}%`),
                ilike(facility.iata, `${prefix}%`),
                ilike(facility.name, namePattern),
                sql`exists (
                  select 1 from unnest(${facility.aliases}) as alias
                  where alias ilike ${namePattern}
                )`
              )
            )
            .orderBy(desc(facility.isPrimary), asc(facility.name))
            .limit(PORT_SEARCH_LIMIT)
        : await base
            .orderBy(desc(facility.isPrimary), asc(facility.name))
            .limit(PORT_SEARCH_LIMIT)

    return rows.map(toFacilityOption)
  }
}

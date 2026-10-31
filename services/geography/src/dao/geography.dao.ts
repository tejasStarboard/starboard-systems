import { and, asc, desc, ilike, or, sql } from "drizzle-orm"
import { currency, facility } from "@starboard/lib-db/schema"
import type { FacilityOption, FormOption } from "@starboard/lib-contracts"

import type { GeographyDb } from "./db"

const PORT_SEARCH_LIMIT = 50

/**
 * Lower pg_trgm thresholds for typo tolerance in the same statement as `%` / `%>`.
 * Required for neon-http (no persistent session GUCs).
 * Must be a single-column scalar subquery (Postgres rejects multi-column scalars).
 */
const applyTrgmThresholds = sql`(
  select set_config('pg_trgm.word_similarity_threshold', '0.35', true)
  from (select set_config('pg_trgm.similarity_threshold', '0.25', true)) as _
) is not null`

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

type FacilityRow = {
  unlocode: string | null
  iata: string | null
  name: string
  facilityTypes: string[]
  countryCode: string
  isPrimary: boolean
  rank?: number | null
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

    const selectCols = {
      unlocode: facility.unlocode,
      iata: facility.iata,
      name: facility.name,
      facilityTypes: facility.facilityTypes,
      countryCode: facility.countryCode,
      isPrimary: facility.isPrimary,
    }

    if (!prefix) {
      const rows = await this.db
        .select(selectCols)
        .from(facility)
        .orderBy(desc(facility.isPrimary), asc(facility.name))
        .limit(PORT_SEARCH_LIMIT)
      return rows.map(toFacilityOption)
    }

    // Split predicates so btree/GIN indexes apply; merge + rank by trigram score.
    const [byCode, byName, byAlias] = await Promise.all([
      this.db
        .select({
          ...selectCols,
          rank: sql<number>`greatest(
            similarity(coalesce(${facility.unlocode}, ''), ${prefix}),
            similarity(coalesce(${facility.iata}, ''), ${prefix})
          )`.as("rank"),
        })
        .from(facility)
        .where(
          and(
            applyTrgmThresholds,
            or(
              ilike(facility.unlocode, `${prefix}%`),
              ilike(facility.iata, `${prefix}%`),
              sql`coalesce(${facility.unlocode}, '') % ${prefix}`,
              sql`coalesce(${facility.iata}, '') % ${prefix}`
            )
          )
        )
        .orderBy(desc(sql`rank`), desc(facility.isPrimary), asc(facility.name))
        .limit(PORT_SEARCH_LIMIT),
      this.db
        .select({
          ...selectCols,
          rank: sql<number>`greatest(
            similarity(${facility.name}, ${trimmed}),
            word_similarity(${trimmed}, ${facility.name})
          )`.as("rank"),
        })
        .from(facility)
        .where(
          and(
            applyTrgmThresholds,
            or(
              ilike(facility.name, namePattern),
              sql`${facility.name} % ${trimmed}`,
              sql`${facility.name} %> ${trimmed}`
            )
          )
        )
        .orderBy(desc(sql`rank`), desc(facility.isPrimary), asc(facility.name))
        .limit(PORT_SEARCH_LIMIT),
      this.db
        .select({
          ...selectCols,
          rank: sql<number>`(
            select max(greatest(similarity(alias, ${trimmed}), word_similarity(${trimmed}, alias)))
            from unnest(${facility.aliases}) as alias
          )`.as("rank"),
        })
        .from(facility)
        .where(
          and(
            applyTrgmThresholds,
            sql`exists (
              select 1 from unnest(${facility.aliases}) as alias
              where alias ilike ${namePattern}
                 or alias % ${trimmed}
                 or alias %> ${trimmed}
            )`
          )
        )
        .orderBy(desc(sql`rank`), desc(facility.isPrimary), asc(facility.name))
        .limit(PORT_SEARCH_LIMIT),
    ])

    const byId = new Map<string, FacilityRow>()
    for (const row of [...byCode, ...byName, ...byAlias] as FacilityRow[]) {
      const key = (row.unlocode ?? row.iata ?? "").toUpperCase()
      if (!key) continue
      const existing = byId.get(key)
      if (!existing || (row.rank ?? 0) > (existing.rank ?? 0)) {
        byId.set(key, row)
      }
    }

    return [...byId.values()]
      .sort((a, b) => {
        const rankDiff = (b.rank ?? 0) - (a.rank ?? 0)
        if (rankDiff !== 0) return rankDiff
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      .slice(0, PORT_SEARCH_LIMIT)
      .map(toFacilityOption)
  }
}

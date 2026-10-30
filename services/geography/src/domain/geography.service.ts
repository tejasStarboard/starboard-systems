import {
  ensureCurrencyRequestSchema,
  listPortsQuerySchema,
  type FormOption,
} from "@starboard/contracts"

import type { GeographyDao } from "../dao/geography.dao"

export interface GeographyService {
  ensureCurrency(code: string): Promise<{ code: string }>
  listCurrencies(): Promise<FormOption[]>
  searchPorts(q?: string): Promise<FormOption[]>
}

export class DefaultGeographyService implements GeographyService {
  constructor(private readonly dao: GeographyDao) {}

  async ensureCurrency(code: string): Promise<{ code: string }> {
    const parsed = ensureCurrencyRequestSchema.safeParse({ code })
    if (!parsed.success) {
      throw new GeographyValidationError(
        parsed.error.issues[0]?.message ?? "Invalid currency code"
      )
    }

    const normalized = await this.dao.ensureCurrency(parsed.data.code)
    return { code: normalized }
  }

  async listCurrencies(): Promise<FormOption[]> {
    return this.dao.listCurrencies()
  }

  async searchPorts(q?: string): Promise<FormOption[]> {
    const parsed = listPortsQuerySchema.safeParse({ q: q ?? "" })
    if (!parsed.success) {
      throw new GeographyValidationError(
        parsed.error.issues[0]?.message ?? "Invalid ports query"
      )
    }

    return this.dao.searchPorts(parsed.data.q)
  }
}

export class GeographyValidationError extends Error {
  readonly status = 400 as const
}

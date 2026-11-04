import {
  ISO_CURRENCIES,
  addressDetailsQuerySchema,
  currencyLabel,
  currencyCodeSchema,
  ensureCurrencyRequestSchema,
  listAddressesQuerySchema,
  listPortsQuerySchema,
  type AddressPrediction,
  type DoorAddress,
  type FacilityOption,
  type FormOption,
  type FxLatestResponse,
} from "@starboard/lib-contracts"

import type { GeographyDao } from "../dao/geography.dao"
import { FrankfurterClient, FxProviderError } from "../integrations/frankfurter"
import type { GooglePlacesClient } from "../integrations/google-places"

export interface GeographyService {
  ensureCurrency(code: string): Promise<{ code: string }>
  listCurrencies(): Promise<FormOption[]>
  getFxRates(base: string): Promise<FxLatestResponse>
  searchPorts(
    q?: string,
    filters?: { country?: string; type?: string }
  ): Promise<FacilityOption[]>
  searchAddresses(q?: string, limit?: number): Promise<AddressPrediction[]>
  getAddressDetails(placeId: string): Promise<DoorAddress>
}

export class DefaultGeographyService implements GeographyService {
  constructor(
    private readonly dao: GeographyDao,
    private readonly places: GooglePlacesClient,
    private readonly fx: Pick<
      FrankfurterClient,
      "latest" | "currencies"
    > = new FrankfurterClient()
  ) {}

  private seeding: Promise<void> | null = null

  /** Seed `geo.currency` once per process: static ISO subset + provider set. */
  private seedCurrencies(): Promise<void> {
    this.seeding ??= (async () => {
      const provider = await this.fx.currencies()
      await this.dao.ensureCurrencies([
        ...ISO_CURRENCIES.map((entry) => entry.code),
        ...Object.keys(provider),
      ])
    })().catch((error) => {
      this.seeding = null
      throw error
    })
    return this.seeding
  }

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
    await this.seedCurrencies()
    const [rows, names] = await Promise.all([
      this.dao.listCurrencies(),
      this.fx.currencies(),
    ])
    return rows.map((row) => ({
      value: row.value,
      label: currencyLabel(row.value, names),
    }))
  }

  /** Latest Frankfurter rates for a quote base (1 base = rate × code). */
  async getFxRates(base: string): Promise<FxLatestResponse> {
    const parsed = currencyCodeSchema.safeParse(base)
    if (!parsed.success) {
      throw new GeographyValidationError(
        parsed.error.issues[0]?.message ?? "Invalid currency code"
      )
    }
    try {
      return await this.fx.latest(parsed.data.toUpperCase())
    } catch (error) {
      if (error instanceof FxProviderError) {
        throw new GeographyValidationError(error.message, error.status)
      }
      throw error
    }
  }

  async searchPorts(
    q?: string,
    filters: { country?: string; type?: string } = {}
  ): Promise<FacilityOption[]> {
    const parsed = listPortsQuerySchema.safeParse({
      q: q ?? "",
      country: filters.country || undefined,
      type: filters.type || undefined,
    })
    if (!parsed.success) {
      throw new GeographyValidationError(
        parsed.error.issues[0]?.message ?? "Invalid ports query"
      )
    }

    return this.dao.searchPorts(parsed.data.q, {
      country: parsed.data.country,
      type: parsed.data.type,
    })
  }

  async searchAddresses(
    q?: string,
    limit?: number
  ): Promise<AddressPrediction[]> {
    if (!this.places.configured) {
      throw new GeographyValidationError(
        "GOOGLE_GEOCODE_API_KEY is not configured",
        503
      )
    }

    const parsed = listAddressesQuerySchema.safeParse({
      q: q ?? "",
      limit: limit ?? 5,
    })
    if (!parsed.success) {
      throw new GeographyValidationError(
        parsed.error.issues[0]?.message ?? "Invalid addresses query"
      )
    }

    const trimmed = parsed.data.q.trim()
    if (trimmed.length < 3) return []

    try {
      return await this.places.searchAddresses(trimmed, parsed.data.limit)
    } catch (error) {
      throw new GeographyValidationError(
        error instanceof Error ? error.message : "Address search failed",
        502
      )
    }
  }

  async getAddressDetails(placeId: string): Promise<DoorAddress> {
    if (!this.places.configured) {
      throw new GeographyValidationError(
        "GOOGLE_GEOCODE_API_KEY is not configured",
        503
      )
    }

    const parsed = addressDetailsQuerySchema.safeParse({ placeId })
    if (!parsed.success) {
      throw new GeographyValidationError(
        parsed.error.issues[0]?.message ?? "Invalid place id"
      )
    }

    try {
      const address = await this.places.getAddressDetails(parsed.data.placeId)
      if (!address) {
        throw new GeographyValidationError("Address not found", 404)
      }
      return address
    } catch (error) {
      if (error instanceof GeographyValidationError) throw error
      throw new GeographyValidationError(
        error instanceof Error ? error.message : "Address details failed",
        502
      )
    }
  }
}

export class GeographyValidationError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 502 | 503 = 400
  ) {
    super(message)
  }
}

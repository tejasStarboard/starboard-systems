import {
  addressDetailsQuerySchema,
  ensureCurrencyRequestSchema,
  listAddressesQuerySchema,
  listPortsQuerySchema,
  type AddressPrediction,
  type DoorAddress,
  type FacilityOption,
  type FormOption,
} from "@starboard/lib-contracts"

import type { GeographyDao } from "../dao/geography.dao"
import type { GooglePlacesClient } from "../integrations/google-places"

export interface GeographyService {
  ensureCurrency(code: string): Promise<{ code: string }>
  listCurrencies(): Promise<FormOption[]>
  searchPorts(q?: string): Promise<FacilityOption[]>
  searchAddresses(q?: string, limit?: number): Promise<AddressPrediction[]>
  getAddressDetails(placeId: string): Promise<DoorAddress>
}

export class DefaultGeographyService implements GeographyService {
  constructor(
    private readonly dao: GeographyDao,
    private readonly places: GooglePlacesClient
  ) {}

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

  async searchPorts(q?: string): Promise<FacilityOption[]> {
    const parsed = listPortsQuerySchema.safeParse({ q: q ?? "" })
    if (!parsed.success) {
      throw new GeographyValidationError(
        parsed.error.issues[0]?.message ?? "Invalid ports query"
      )
    }

    return this.dao.searchPorts(parsed.data.q)
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

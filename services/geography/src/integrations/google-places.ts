import type { AddressPrediction, DoorAddress } from "@starboard/lib-contracts"

const AUTOCOMPLETE_URL =
  "https://maps.googleapis.com/maps/api/place/autocomplete/json"
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

const NORTH_AMERICA = ["us", "ca", "mx"]

type GooglePrediction = {
  place_id: string
  description?: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

type GoogleAddressComponent = {
  long_name: string
  short_name: string
  types: string[]
}

type GooglePlaceDetails = {
  formatted_address?: string
  address_components?: GoogleAddressComponent[]
  geometry?: { location?: { lat?: number; lng?: number } }
}

function postalCountries(countryCode?: string | null): string[] {
  const code = (countryCode ?? "").toLowerCase()
  return code && !NORTH_AMERICA.includes(code) ? [code] : NORTH_AMERICA
}

function mergePredictions(
  general: GooglePrediction[],
  postal: GooglePrediction[],
  limit: number
): GooglePrediction[] {
  const merged: GooglePrediction[] = []
  const seen = new Set<string>()
  const max = Math.max(general.length, postal.length)
  for (let i = 0; i < max; i++) {
    for (const hit of [general[i], postal[i]]) {
      if (hit && !seen.has(hit.place_id)) {
        seen.add(hit.place_id)
        merged.push(hit)
        if (merged.length >= limit) return merged
      }
    }
  }
  return merged
}

function toPrediction(result: GooglePrediction): AddressPrediction {
  const structured = result.structured_formatting ?? {}
  let mainText = structured.main_text ?? ""
  let secondaryText = structured.secondary_text ?? ""
  if (!mainText && result.description) {
    const parts = result.description.split(",", 2)
    mainText = parts[0]?.trim() ?? ""
    secondaryText = parts[1]?.trim() ?? ""
  }
  return {
    placeId: result.place_id,
    description: result.description ?? "",
    mainText,
    secondaryText,
  }
}

async function autocomplete(
  apiKey: string,
  query: string,
  extra: Record<string, string> = {}
): Promise<GooglePrediction[]> {
  const params = new URLSearchParams({
    input: query,
    key: apiKey,
    ...extra,
  })
  const response = await fetch(`${AUTOCOMPLETE_URL}?${params}`)
  if (!response.ok) {
    throw new Error(`Places autocomplete HTTP ${response.status}`)
  }
  const body = (await response.json()) as {
    status: string
    predictions?: GooglePrediction[]
    error_message?: string
  }
  if (body.status !== "OK" && body.status !== "ZERO_RESULTS") {
    throw new Error(
      body.error_message ?? `Places autocomplete status ${body.status}`
    )
  }
  return body.predictions ?? []
}

function component(
  components: GoogleAddressComponent[],
  typeNames: string[],
  useShort = false
): string {
  for (const comp of components) {
    if (typeNames.some((t) => comp.types.includes(t))) {
      return useShort ? comp.short_name : comp.long_name
    }
  }
  return ""
}

export class GooglePlacesClient {
  constructor(private readonly apiKey: string | undefined) {}

  get configured() {
    return Boolean(this.apiKey?.trim())
  }

  async searchAddresses(
    query: string,
    limit = 5,
    countryCode?: string | null
  ): Promise<AddressPrediction[]> {
    const trimmed = query.trim()
    if (!trimmed || !this.apiKey) return []

    const [general, postal] = await Promise.all([
      autocomplete(this.apiKey, trimmed).catch(() => [] as GooglePrediction[]),
      autocomplete(this.apiKey, trimmed, {
        types: "postal_code",
        components: postalCountries(countryCode)
          .map((c) => `country:${c}`)
          .join("|"),
      }).catch(() => [] as GooglePrediction[]),
    ])

    return mergePredictions(general, postal, limit).map(toPrediction)
  }

  async getAddressDetails(placeId: string): Promise<DoorAddress | null> {
    const id = placeId.trim()
    if (!id || !this.apiKey) return null

    const params = new URLSearchParams({
      place_id: id,
      fields: "formatted_address,address_component,geometry",
      key: this.apiKey,
    })
    const response = await fetch(`${DETAILS_URL}?${params}`)
    if (!response.ok) {
      throw new Error(`Places details HTTP ${response.status}`)
    }
    const body = (await response.json()) as {
      status: string
      result?: GooglePlaceDetails
      error_message?: string
    }
    if (body.status !== "OK" || !body.result) {
      throw new Error(
        body.error_message ?? `Places details status ${body.status}`
      )
    }

    const place = body.result
    const components = place.address_components ?? []
    const streetNumber = component(components, ["street_number"])
    const route = component(components, ["route"])
    const street =
      streetNumber && route
        ? `${streetNumber} ${route}`
        : route || streetNumber

    const city =
      component(components, ["locality"]) ||
      component(components, ["sublocality_level_1"]) ||
      component(components, ["sublocality"]) ||
      component(components, ["administrative_area_level_2"]) ||
      component(components, ["neighborhood"])

    const formatted = place.formatted_address ?? ""
    const lat = place.geometry?.location?.lat ?? null
    const lng = place.geometry?.location?.lng ?? null

    return {
      street,
      city,
      state: component(components, ["administrative_area_level_1"]),
      zip: component(components, ["postal_code"]),
      country: component(components, ["country"]),
      countryCode: component(components, ["country"], true),
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
      label: formatted || [street, city].filter(Boolean).join(", "),
    }
  }
}

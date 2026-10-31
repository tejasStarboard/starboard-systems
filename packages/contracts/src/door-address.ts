import { z } from "zod"

/**
 * Door address snapshot persisted on the quote lane (starboard-2 style).
 * Searched via Google Places; stored denormalized — not a gazetteer FK.
 */
export const doorAddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
  countryCode: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  /** Display label in the combobox (usually Places description). */
  label: z.string(),
})

export type DoorAddress = z.infer<typeof doorAddressSchema>

export function emptyDoorAddress(): DoorAddress {
  return {
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    countryCode: "",
    lat: null,
    lng: null,
    label: "",
  }
}

export function isDoorAddressEmpty(address: DoorAddress | null | undefined) {
  if (!address) return true
  return !address.label.trim() && !address.street.trim() && !address.city.trim()
}

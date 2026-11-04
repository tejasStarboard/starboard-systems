/** `{ value, label }` option shape shared with the quote form (`FormOption`). */
export type ComboboxOption = { value: string; label: string }

/** Port search hit: option + optional geo fields from `GET /api/geography/ports`. */
export type PortOption = ComboboxOption & {
  country?: string
  types?: string[]
  latitude?: number | null
  longitude?: number | null
}

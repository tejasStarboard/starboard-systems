import type { UsageUnit } from "@starboard/lib-contracts"

/** FCL charge-grid labels. Enum values stay stable for pricing fixtures. */
export const USAGE_UNIT_LABELS: { value: UsageUnit; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "container", label: "Per Eq" },
  { value: "teu", label: "TEU" },
  { value: "cbm", label: "CBM" },
  { value: "kg", label: "Per KG" },
  { value: "ton", label: "Ton" },
  { value: "wm", label: "W/M" },
  { value: "pallet", label: "Pallet" },
  { value: "per_time", label: "Per Day" },
  { value: "percentage", label: "% freight" },
  { value: "unknown", label: "Unknown" },
]

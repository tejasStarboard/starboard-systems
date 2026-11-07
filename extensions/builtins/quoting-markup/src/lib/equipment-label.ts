/** Friendly names for common ISO container type codes (seed-aligned). */
const EQUIPMENT_LABELS: Readonly<Record<string, string>> = {
  "20GP": "20' General Purpose",
  "20OT": "20' Open Top",
  "40GP": "40' General Purpose",
  "40HC": "40' High Cube",
  "40OT": "40' Open Top",
  "45GP": "45' General Purpose",
  "45HC": "45' High Cube",
  "20RF": "20' Reefer",
  "40RF": "40' Reefer",
  "40RH": "40' Reefer High Cube",
  "40NOR": "40' Non-Operating Reefer",
}

export function equipmentLabel(code: string | undefined | null): string {
  const trimmed = code?.trim() ?? ""
  if (!trimmed) return "Eq"
  return EQUIPMENT_LABELS[trimmed.toUpperCase()] ?? trimmed
}

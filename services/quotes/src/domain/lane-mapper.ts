import type {
  Cargo,
  ContainerLine,
  DoorAddress,
  LaneFormValues,
  ManualRateLine,
  SurchargeLine,
} from "@starboard/lib-contracts"
import { emptyDoorAddress, isDoorAddressEmpty } from "@starboard/lib-contracts"

export type LaneRow = {
  id: string
  mode: LaneFormValues["mode"]
  pickupAddress: DoorAddress | null
  origin: string | null
  originVia: string | null
  destinationVia: string | null
  destination: string | null
  deliveryAddress: DoorAddress | null
  quoteId: string
  cargo: Cargo[]
  markupType: LaneFormValues["markupType"]
  markupValue: number
  selectedRateId: string | null
}

export type RateRow = {
  id: string
  laneId: string
  currencyCode: string
  label: string
  rate: number
  baseMode: LaneFormValues["manualRates"][number]["baseMode"]
  equipmentAmounts: LaneFormValues["manualRates"][number]["equipmentAmounts"]
  validFrom: Date
  validTo: Date
}

export type SurchargeRow = {
  id: string
  rateId: string
  name: string
  leg: SurchargeLine["leg"]
  usageUnit: SurchargeLine["usageUnit"]
  rate: number | null
  ratePercentage: number | null
  currencyCode: string
  source: SurchargeLine["source"]
  isIncludedInTotal: boolean
  isRemoved: boolean
  isVisible: boolean
  freeUsage: number | null
  minUsage: number | null
  maxUsage: number | null
  buyAmount: number | null
  sellAmount: number | null
  scopeOverride: SurchargeLine["scopeOverride"]
  equipmentType: string | null
}

/** Quote-level global charge row (FK → quote, not rate). */
export type GlobalChargeRow = Omit<SurchargeRow, "rateId"> & {
  quoteId: string
}

export type RateValidity = {
  validFrom: Date
  validTo: Date
}

const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000

export function resolveRateValidity(input: {
  effectiveFrom: Date | null
  expiryAt: Date | null
  now?: Date
}): RateValidity {
  const now = input.now ?? new Date()
  return {
    validFrom: input.effectiveFrom ?? now,
    validTo: input.expiryAt ?? new Date(now.getTime() + MS_PER_YEAR),
  }
}

export function cargoFromLaneForm(lane: LaneFormValues): Cargo[] {
  const now = new Date()

  if (lane.mode === "fcl") {
    return lane.containers.map((line) => ({
      id: line.id,
      description: "",
      createdAt: now,
      updatedAt: now,
      weight: line.weight,
      mode: "fcl" as const,
      containerCount: Math.trunc(line.count),
      containerType: line.containerType,
    }))
  }

  return [
    {
      id: lane.id,
      description: "",
      createdAt: now,
      updatedAt: now,
      weight: lane.weight,
      mode: lane.mode,
      volume: lane.volume,
      palletCount: Math.trunc(lane.palletCount),
      palletType: lane.palletType,
      hazmat: false,
      fragile: false,
    },
  ]
}

export function containersFromCargo(cargo: Cargo[]): ContainerLine[] {
  return cargo
    .filter(
      (item): item is Extract<Cargo, { mode: "fcl" }> => item.mode === "fcl"
    )
    .map((item) => ({
      id: item.id,
      containerType: item.containerType,
      weight: item.weight,
      count: item.containerCount,
    }))
}

export function scalarsFromCargo(cargo: Cargo[]): {
  weight: number
  volume: number
  palletCount: number
  palletType: string
} {
  const item = cargo.find(
    (entry): entry is Extract<Cargo, { mode: "lcl" | "air" }> =>
      entry.mode === "lcl" || entry.mode === "air"
  )

  if (!item) {
    return { weight: 0, volume: 0, palletCount: 0, palletType: "" }
  }

  return {
    weight: item.weight,
    volume: item.volume,
    palletCount: item.palletCount,
    palletType: item.palletType,
  }
}

function doorAddressOrNull(address: DoorAddress): DoorAddress | null {
  return isDoorAddressEmpty(address) ? null : address
}

function surchargeLineToRow(line: SurchargeLine, rateId: string): SurchargeRow {
  return {
    id: line.id,
    rateId,
    name: line.name,
    leg: line.leg,
    usageUnit: line.usageUnit,
    rate: line.rate,
    ratePercentage: line.ratePercentage,
    currencyCode: line.currencyCode,
    source: line.source,
    isIncludedInTotal: line.isIncludedInTotal,
    isRemoved: line.isRemoved,
    isVisible: line.isVisible,
    freeUsage: line.freeUsage,
    minUsage: line.minUsage,
    maxUsage: line.maxUsage,
    buyAmount: line.buyAmount,
    sellAmount: line.sellAmount,
    scopeOverride: line.scopeOverride,
    equipmentType: line.equipmentType,
  }
}

function surchargeRowToLine(
  row: Pick<
    SurchargeRow,
    | "id"
    | "name"
    | "leg"
    | "usageUnit"
    | "rate"
    | "ratePercentage"
    | "currencyCode"
    | "source"
    | "isIncludedInTotal"
    | "isRemoved"
    | "isVisible"
    | "freeUsage"
    | "minUsage"
    | "maxUsage"
    | "buyAmount"
    | "sellAmount"
    | "scopeOverride"
    | "equipmentType"
  >
): SurchargeLine {
  return {
    id: row.id,
    name: row.name,
    leg: row.leg,
    usageUnit: row.usageUnit,
    rate: row.rate,
    ratePercentage: row.ratePercentage,
    currencyCode: row.currencyCode,
    source: row.source,
    isIncludedInTotal: row.isIncludedInTotal,
    isRemoved: row.isRemoved,
    isVisible: row.isVisible,
    freeUsage: row.freeUsage,
    minUsage: row.minUsage,
    maxUsage: row.maxUsage,
    buyAmount: row.buyAmount,
    sellAmount: row.sellAmount,
    scopeOverride: row.scopeOverride,
    equipmentType: row.equipmentType ?? null,
  }
}

export function globalChargeLineToRow(
  line: SurchargeLine,
  quoteId: string
): GlobalChargeRow {
  return {
    id: line.id,
    quoteId,
    name: line.name,
    leg: line.leg,
    usageUnit: line.usageUnit,
    rate: line.rate,
    ratePercentage: line.ratePercentage,
    currencyCode: line.currencyCode,
    source: "global",
    isIncludedInTotal: line.isIncludedInTotal,
    isRemoved: line.isRemoved,
    isVisible: line.isVisible,
    freeUsage: line.freeUsage,
    minUsage: line.minUsage,
    maxUsage: line.maxUsage,
    buyAmount: line.buyAmount,
    sellAmount: line.sellAmount,
    scopeOverride: line.scopeOverride,
    equipmentType: line.equipmentType,
  }
}

export function globalChargeRowToLine(row: GlobalChargeRow): SurchargeLine {
  return surchargeRowToLine(row)
}

export function laneFormToRows(
  lane: LaneFormValues,
  quoteId: string,
  currencyCode: string,
  validity: RateValidity
): { lane: LaneRow; rates: RateRow[]; surcharges: SurchargeRow[] } {
  const currency = currencyCode.trim().toUpperCase() || "USD"
  const rates: RateRow[] = []
  const surcharges: SurchargeRow[] = []

  for (const line of lane.manualRates) {
    rates.push({
      id: line.id,
      laneId: lane.id,
      currencyCode: currency,
      label: line.label,
      rate: line.amount,
      baseMode: line.baseMode,
      equipmentAmounts: line.equipmentAmounts,
      validFrom: validity.validFrom,
      validTo: validity.validTo,
    })
    for (const surcharge of line.surcharges ?? []) {
      surcharges.push(surchargeLineToRow(surcharge, line.id))
    }
  }

  return {
    lane: {
      id: lane.id,
      mode: lane.mode,
      pickupAddress: doorAddressOrNull(lane.pickup),
      origin: emptyToNull(lane.origin),
      originVia: emptyToNull(lane.originVia),
      destinationVia: emptyToNull(lane.destinationVia),
      destination: emptyToNull(lane.destination),
      deliveryAddress: doorAddressOrNull(lane.delivery),
      quoteId,
      cargo: cargoFromLaneForm(lane),
      markupType: lane.markupType,
      markupValue: lane.markupValue,
      selectedRateId: emptyToNull(lane.selectedRateId),
    },
    rates,
    surcharges,
  }
}

export function rowsToLaneForm(
  row: LaneRow,
  rates: RateRow[],
  surchargesByRateId: Map<string, SurchargeRow[]> = new Map()
): LaneFormValues {
  const scalars = scalarsFromCargo(row.cargo)
  const containers =
    row.mode === "fcl"
      ? containersFromCargo(row.cargo)
      : ([] as ContainerLine[])

  return {
    id: row.id,
    mode: row.mode,
    pickup: row.pickupAddress ?? emptyDoorAddress(),
    origin: row.origin ?? "",
    originVia: row.originVia ?? "",
    destinationVia: row.destinationVia ?? "",
    destination: row.destination ?? "",
    delivery: row.deliveryAddress ?? emptyDoorAddress(),
    containers,
    weight: scalars.weight,
    volume: scalars.volume,
    palletCount: scalars.palletCount,
    palletType: scalars.palletType,
    manualRates: rates.map((rate): ManualRateLine => ({
      id: rate.id,
      label: rate.label,
      amount: rate.rate,
      baseMode: rate.baseMode === "per_eq" ? "per_eq" : "flat",
      equipmentAmounts: rate.equipmentAmounts ?? [],
      surcharges: (surchargesByRateId.get(rate.id) ?? []).map(
        surchargeRowToLine
      ),
    })),
    selectedRateId: row.selectedRateId ?? "",
    markupType: row.markupType,
    markupValue: row.markupValue,
  }
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

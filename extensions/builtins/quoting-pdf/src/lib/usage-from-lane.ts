import type { LaneFormValues } from "@starboard/lib-contracts"
import { buildLaneUsageQuantities } from "@starboard/lib-pricing"

/** Same usage derivation as the quote editor totals path. */
export function usageFromLane(lane: LaneFormValues | undefined) {
  if (!lane) {
    return buildLaneUsageQuantities({})
  }
  if (lane.mode === "fcl") {
    const containerCount = lane.containers.reduce(
      (sum, line) => sum + (Number.isFinite(line.count) ? line.count : 0),
      0
    )
    const weightKg = lane.containers.reduce(
      (sum, line) => sum + (Number.isFinite(line.weight) ? line.weight : 0),
      0
    )
    return buildLaneUsageQuantities({ containerCount, weightKg })
  }
  return buildLaneUsageQuantities({
    weightKg: lane.weight,
    volumeCbm: lane.volume,
    palletCount: lane.palletCount,
  })
}

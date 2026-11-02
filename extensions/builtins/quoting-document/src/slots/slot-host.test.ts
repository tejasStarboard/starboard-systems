import { describe, expect, test } from "bun:test"

import { resolveSlotEntries } from "./slot-host"
import type { SlotContribution } from "./types"

const A = () => null
const B = () => null

const charges: SlotContribution = {
  id: "quoting.charges.table",
  extensionId: "quoting.charges",
}
const spot: SlotContribution = {
  id: "spot.maersk.source",
  extensionId: "spot.maersk",
  component: "rates.spotSource",
  props: { carrier: "maersk" },
}

describe("resolveSlotEntries", () => {
  test("resolves by contribution id, in order", () => {
    const entries = resolveSlotEntries([charges, spot], {
      "quoting.charges.table": A as never,
      "rates.spotSource": B as never,
    })
    expect(entries.map((e) => e.contribution.id)).toEqual([
      "quoting.charges.table",
      "spot.maersk.source",
    ])
    expect(entries[0]!.Component).toBe(A as never)
  })

  test("`component` key wins over id so spot workers share one panel", () => {
    const entries = resolveSlotEntries([spot], {
      "spot.maersk.source": A as never,
      "rates.spotSource": B as never,
    })
    expect(entries[0]!.Component).toBe(B as never)
  })

  test("fails closed: no contributions or no factory mounts nothing", () => {
    expect(resolveSlotEntries(undefined, { x: A as never })).toEqual([])
    expect(resolveSlotEntries([], { x: A as never })).toEqual([])
    expect(resolveSlotEntries([charges], {})).toEqual([])
  })
})

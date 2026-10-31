import { describe, expect, test } from "bun:test"

import { loadRolloutContext } from "./extensions-rollout"

describe("loadRolloutContext", () => {
  test("returns context when getRolloutMap succeeds", async () => {
    const rollouts = new Map()
    const context = await loadRolloutContext("org-1", async () => rollouts)
    expect(context).toEqual({ organizationId: "org-1", rollouts })
  })

  test("fails closed on getRolloutMap error", async () => {
    const errors: unknown[] = []
    const context = await loadRolloutContext(
      "org-1",
      async () => {
        throw new Error("db down")
      },
      (error) => errors.push(error)
    )
    expect(context).toBeNull()
    expect(errors).toHaveLength(1)
  })
})

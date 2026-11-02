import { describe, expect, test } from "bun:test"

import fixtures from "../fixtures/incoterm-scope.json"
import { excludedBucketsForIncoterm } from "./incoterm-scope"
import type { ScopeBucket } from "./total-inclusion"

type Case = {
  id: string
  incoterm: string
  role: string
  excluded: ScopeBucket[]
}

describe("excludedBucketsForIncoterm", () => {
  for (const fixture of (fixtures as { cases: Case[] }).cases) {
    test(fixture.id, () => {
      expect(
        excludedBucketsForIncoterm({
          incoterm: fixture.incoterm,
          role: fixture.role,
        })
      ).toEqual(fixture.excluded)
    })
  }
})

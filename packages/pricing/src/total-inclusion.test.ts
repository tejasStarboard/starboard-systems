import { describe, expect, test } from "bun:test"

import sharedCases from "../fixtures/total-inclusion-test-cases.json"
import {
  isIncludedInTotal,
  type ScopeBucket,
  type TotalKind,
} from "./total-inclusion"

type CaseInput = {
  flags: {
    is_removed?: boolean | null
    is_visible?: boolean | null
    is_included_in_total?: boolean | null
  }
  excludedByIncoterm: boolean
  totalKind: TotalKind
  surchargeLeg?: string | null
  scopeOverride?: "include" | "exclude" | null
  excludedBuckets?: ScopeBucket[]
  surchargeSource?: string | null
}

type CaseFixture = {
  id: string
  input: CaseInput
  expected: boolean
}

const cases = (sharedCases as { cases: CaseFixture[] }).cases

describe("isIncludedInTotal — shared fixture parity", () => {
  for (const fixture of cases) {
    test(fixture.id, () => {
      const leg = { excluded_by_incoterm: fixture.input.excludedByIncoterm }
      const surcharge = {
        ...fixture.input.flags,
        leg: fixture.input.surchargeLeg,
        scope_override: fixture.input.scopeOverride,
        source: fixture.input.surchargeSource,
      }
      const scope = fixture.input.excludedBuckets
        ? { excluded_buckets: fixture.input.excludedBuckets }
        : undefined
      expect(
        isIncludedInTotal(surcharge, leg, fixture.input.totalKind, scope)
      ).toBe(fixture.expected)
    })
  }
})

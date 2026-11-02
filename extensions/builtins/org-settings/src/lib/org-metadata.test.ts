import { describe, expect, test } from "bun:test"

import { parseOrgMetadata } from "./org-metadata"

describe("parseOrgMetadata", () => {
  test("parses JSON string metadata with quote rules", () => {
    expect(
      parseOrgMetadata(
        JSON.stringify({ quoteRules: { defaultValidityDays: 14 } })
      )
    ).toEqual({ quoteRules: { defaultValidityDays: 14 } })
  })

  test("drops invalid validity days", () => {
    expect(
      parseOrgMetadata({ quoteRules: { defaultValidityDays: 0 } }).quoteRules
    ).toBeUndefined()
  })
})

import { describe, expect, test } from "bun:test"

import { orgDefaultBaseCurrency, parseOrgMetadata } from "./org-metadata"

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

describe("default base currency", () => {
  test("parses and normalizes defaultBaseCurrency", () => {
    expect(
      parseOrgMetadata({
        quoteRules: { defaultValidityDays: 14, defaultBaseCurrency: " eur " },
      }).quoteRules
    ).toEqual({ defaultValidityDays: 14, defaultBaseCurrency: "EUR" })
  })

  test("keeps currency when validity days are invalid; drops bad codes", () => {
    expect(
      parseOrgMetadata({
        quoteRules: { defaultValidityDays: 0, defaultBaseCurrency: "USD" },
      }).quoteRules
    ).toEqual({ defaultBaseCurrency: "USD" })
    expect(
      parseOrgMetadata({ quoteRules: { defaultBaseCurrency: "US" } }).quoteRules
    ).toBeUndefined()
  })

  test("orgDefaultBaseCurrency reads JSON string metadata", () => {
    expect(
      orgDefaultBaseCurrency(
        JSON.stringify({ quoteRules: { defaultBaseCurrency: "gbp" } })
      )
    ).toBe("GBP")
    expect(orgDefaultBaseCurrency(null)).toBeNull()
  })
})

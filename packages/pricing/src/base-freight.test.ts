import { describe, expect, test } from "bun:test"

import identityCases from "../fixtures/base-freight-row-identity.json"
import {
  findBaseFreightRow,
  isBaseFreightRow,
  type BaseFreightRowInput,
} from "./base-freight"

const fixture = identityCases as {
  cases: {
    desc: string
    source: string | null
    leg: string | null
    is_base_freight: boolean
    name: string
    want: boolean
  }[]
}

describe("isBaseFreightRow — base-freight-row-identity fixture", () => {
  for (const row of fixture.cases) {
    test(row.desc, () => {
      const input: BaseFreightRowInput = {
        name: row.name,
        leg: row.leg,
        source: row.source,
        isBaseFreight: row.is_base_freight,
      }
      expect(isBaseFreightRow(input)).toBe(row.want)
    })
  }
})

describe("findBaseFreightRow", () => {
  test("stamp outranks later name match", () => {
    const rows: BaseFreightRowInput[] = [
      {
        name: "Ocean Freight",
        source: "carrier",
        leg: "freight",
        isBaseFreight: false,
      },
      {
        name: "Trucking",
        source: "carrier",
        leg: null,
        isBaseFreight: true,
      },
    ]
    expect(findBaseFreightRow(rows)?.name).toBe("Trucking")
  })

  test("skips removed and global rows", () => {
    const rows: BaseFreightRowInput[] = [
      {
        name: "ocean_freight",
        source: "global",
        isBaseFreight: true,
      },
      {
        name: "ocean_freight",
        source: "carrier",
        isRemoved: true,
      },
      {
        name: "Ocean Freight",
        source: "carrier",
        leg: "freight",
      },
    ]
    expect(findBaseFreightRow(rows)?.name).toBe("Ocean Freight")
  })
})

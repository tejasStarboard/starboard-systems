import { describe, expect, test } from "bun:test"

import { extensionApiPath } from "./extension-api-path"

describe("extensionApiPath", () => {
  test("builds jobs and status URLs from extension id", () => {
    expect(extensionApiPath("spot.fake", "jobs")).toBe(
      "/api/extensions/spot.fake/jobs"
    )
    expect(extensionApiPath("ingestion.fcl_v6", "jobs", "wf-1")).toBe(
      "/api/extensions/ingestion.fcl_v6/jobs/wf-1"
    )
  })
})

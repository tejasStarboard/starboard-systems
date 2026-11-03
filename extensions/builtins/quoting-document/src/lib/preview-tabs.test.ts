import { describe, expect, test } from "bun:test"

import { contributesToPreviewTab } from "./preview-tabs"

describe("contributesToPreviewTab (092)", () => {
  test("routes by props.tab; missing tab mounts on both", () => {
    expect(contributesToPreviewTab({ props: { tab: "pdf" } }, "pdf")).toBe(true)
    expect(contributesToPreviewTab({ props: { tab: "pdf" } }, "email")).toBe(
      false
    )
    expect(contributesToPreviewTab({ props: { tab: "email" } }, "email")).toBe(
      true
    )
    expect(contributesToPreviewTab({}, "pdf")).toBe(true)
    expect(contributesToPreviewTab({}, "email")).toBe(true)
  })
})

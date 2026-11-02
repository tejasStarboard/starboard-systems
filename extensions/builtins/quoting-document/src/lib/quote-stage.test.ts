import { describe, expect, test } from "bun:test"

import { canRunExportCommand, isCommercialEditable } from "./quote-stage"

describe("quote stage gates (082)", () => {
  test("terminal stages lock commercial edits", () => {
    expect(isCommercialEditable("draft")).toBe(true)
    expect(isCommercialEditable("review")).toBe(true)
    expect(isCommercialEditable("sent")).toBe(true)
    expect(isCommercialEditable("win")).toBe(false)
    expect(isCommercialEditable("loss")).toBe(false)
    expect(isCommercialEditable("expired")).toBe(false)
  })

  test("export commands only for sent / win / loss", () => {
    expect(canRunExportCommand("draft")).toBe(false)
    expect(canRunExportCommand("review")).toBe(false)
    expect(canRunExportCommand("expired")).toBe(false)
    expect(canRunExportCommand("sent")).toBe(true)
    expect(canRunExportCommand("win")).toBe(true)
    expect(canRunExportCommand("loss")).toBe(true)
  })
})

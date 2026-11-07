import { describe, expect, test } from "bun:test"

import {
  QUOTE_SAVED_EVENT,
  emitQuoteSaved,
  subscribeQuoteSaved,
} from "./quote-events"

describe("quote-events", () => {
  test("subscribeQuoteSaved receives emitQuoteSaved", () => {
    const seen: string[] = []
    const stop = subscribeQuoteSaved((id) => seen.push(id))
    emitQuoteSaved("abc-123")
    emitQuoteSaved("  ")
    stop()
    emitQuoteSaved("after-unsub")
    expect(seen).toEqual(["abc-123"])
  })

  test("event name is stable for workbench listeners", () => {
    expect(QUOTE_SAVED_EVENT).toBe("starboard:quote-saved")
  })
})

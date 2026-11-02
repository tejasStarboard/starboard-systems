import { describe, expect, test } from "bun:test"
import { getActiveWorkbenchContributions } from "@starboard/ext-host"

import { builtinEditors } from "./builtin-editors"
import { resolveWorkbenchContributions } from "./contributions"
import { initialTabsState, tabHref, tabsReducer } from "./tabs"
import { EMPTY_CONTRIBUTIONS } from "./types"

describe("076 built-in stubs in the workbench", () => {
  const merged = resolveWorkbenchContributions({
    kernelOnly: false,
    hostContributions: getActiveWorkbenchContributions("credit"),
  })

  test("stub Quotes view appears under the Quotes activity", () => {
    expect(merged.activity.filter((a) => a.id === "quotes")).toHaveLength(1)
    const stub = merged.views.find((v) => v.id === "quoting.document.stub")
    expect(stub?.activityId).toBe("quotes")
    expect(stub?.entries[0]?.opens?.viewType).toBe("quote.stub")
    // Legacy shim is untouched.
    expect(merged.views.find((v) => v.id === "quotes.list")?.name).toBe(
      "Quotes"
    )
  })

  test("opening the stub entry yields a tab with a built-in editor factory", () => {
    const opens = merged.views.find((v) => v.id === "quoting.document.stub")!
      .entries[0]!.opens!
    const state = tabsReducer(initialTabsState(), { type: "open", ...opens })
    expect(state.tabs).toHaveLength(1)
    expect(state.activeTabId).toBe("quote.stub:stub-1")
    const editor = merged.editors.find((e) => e.viewType === "quote.stub")
    expect(editor?.deepLink).toBeUndefined()
    expect(tabHref(state.tabs[0]!, merged.editors)).toBeNull()
    expect(typeof builtinEditors["quote.stub"]).toBe("function")
  })

  test("kernel-only stays empty even with built-ins active", () => {
    expect(
      resolveWorkbenchContributions({
        kernelOnly: true,
        hostContributions: getActiveWorkbenchContributions("enterprise"),
      })
    ).toEqual(EMPTY_CONTRIBUTIONS)
  })
})

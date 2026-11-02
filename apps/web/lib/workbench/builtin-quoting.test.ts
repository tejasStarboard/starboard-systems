import { describe, expect, test } from "bun:test"
import { getActiveWorkbenchContributions } from "@starboard/ext-host"

import {
  builtinEditors,
  builtinPointComponents,
  builtinViews,
} from "./builtin-editors"
import { resolveWorkbenchContributions } from "./contributions"
import { matchDeepLink } from "./deep-link"
import { initialTabsState, tabHref, tabsReducer } from "./tabs"
import { EMPTY_CONTRIBUTIONS } from "./types"

describe("077 quoting.document in the workbench", () => {
  const merged = resolveWorkbenchContributions({
    kernelOnly: false,
    hostContributions: getActiveWorkbenchContributions("credit"),
  })

  test("Quotes activity + list view come only from the built-in", () => {
    expect(merged.activity.filter((a) => a.id === "quotes")).toHaveLength(1)
    expect(merged.activity[0]?.id).toBe("quotes")
    const view = merged.views.find((v) => v.id === "quoting.document.list")
    expect(view?.activityId).toBe("quotes")
    expect(merged.views.find((v) => v.id === "quotes.list")).toBeUndefined()
    expect(typeof builtinViews["quoting.document.list"]).toBe("function")
  })

  test("/quote/:id deep link opens the built-in `quote` editor", () => {
    expect(matchDeepLink("/quote/q-1", merged.editors)).toEqual({
      viewType: "quote",
      resourceId: "q-1",
    })
    const state = tabsReducer(initialTabsState(), {
      type: "route",
      pathname: "/quote/q-1",
      editors: merged.editors,
    })
    expect(state.activeTabId).toBe("quote:q-1")
    expect(typeof builtinEditors["quote"]).toBe("function")
    expect(tabHref(state.tabs[0]!, merged.editors)).toBe("/quote/q-1")
  })

  test("home `/` auto-opens the quote.list editor and round-trips", () => {
    const state = tabsReducer(initialTabsState(), {
      type: "route",
      pathname: "/",
      editors: merged.editors,
    })
    expect(state.activeTabId).toBe("quote.list:/")
    expect(tabHref(state.tabs[0]!, merged.editors)).toBe("/")
  })

  test("sidebar entry opens the list editor tab on the same route", () => {
    const opens = merged.views.find((v) => v.id === "quoting.document.list")!
      .entries[0]!.opens!
    const state = tabsReducer(initialTabsState(), { type: "open", ...opens })
    expect(state.activeTabId).toBe("quote.list:/")
    expect(tabHref(state.tabs[0]!, merged.editors)).toBe("/")
    expect(typeof builtinEditors["quote.list"]).toBe("function")
  })

  test("unplugged: no quote editor contribution, so no built-in render", () => {
    const off = resolveWorkbenchContributions({
      kernelOnly: false,
      hostContributions: getActiveWorkbenchContributions("credit", []),
    })
    expect(off.editors.find((e) => e.viewType === "quote")).toBeUndefined()
    expect(off.activity.find((a) => a.id === "quotes")).toBeUndefined()
  })

  test("kernel-only stays empty even with built-ins active", () => {
    expect(
      resolveWorkbenchContributions({
        kernelOnly: true,
        hostContributions: getActiveWorkbenchContributions("enterprise"),
      })
    ).toEqual(EMPTY_CONTRIBUTIONS)
  })

  test("073: every active slot contribution resolves to a UI factory", () => {
    const { points } = getActiveWorkbenchContributions("credit")
    const all = Object.values(points).flat()
    expect(all.length).toBeGreaterThan(0)
    for (const contribution of all) {
      const key = contribution.component ?? contribution.id
      expect(typeof builtinPointComponents[key]).toBe("function")
    }
    // The kernel registry is keyed by contribution/component ids, never by slot.
    expect(
      Object.keys(builtinPointComponents).some((key) =>
        key.startsWith("quoting.slots.")
      )
    ).toBe(false)
  })
})

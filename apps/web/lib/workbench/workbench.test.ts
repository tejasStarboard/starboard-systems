import { describe, expect, test } from "bun:test"

import {
  isKernelOnlyFlag,
  legacyShellContributions,
  resolveWorkbenchContributions,
} from "./contributions"
import { buildDeepLink, matchDeepLink } from "./deep-link"
import { initialTabsState, tabHref, tabsReducer, type TabsAction } from "./tabs"
import { EMPTY_CONTRIBUTIONS } from "./types"

const editors = legacyShellContributions().editors

function run(...actions: TabsAction[]) {
  return actions.reduce(tabsReducer, initialTabsState())
}

describe("kernel-only workbench", () => {
  test("flag parsing", () => {
    expect(isKernelOnlyFlag("1")).toBe(true)
    expect(isKernelOnlyFlag("true")).toBe(true)
    expect(isKernelOnlyFlag("0")).toBe(false)
    expect(isKernelOnlyFlag(undefined)).toBe(false)
  })

  test("no contributions → empty regions, no tabs for any path", () => {
    const contributions = resolveWorkbenchContributions({
      kernelOnly: true,
      extensionNav: [{ id: "x", label: "X", href: "/x" }],
    })
    expect(contributions).toEqual(EMPTY_CONTRIBUTIONS)
    const state = run({
      type: "route",
      pathname: "/quote/abc",
      editors: contributions.editors,
    })
    expect(state.tabs).toEqual([])
    expect(state.activeTabId).toBeNull()
  })
})

describe("deep links", () => {
  test("quote id resolves to viewType quote", () => {
    expect(matchDeepLink("/quote/q-123", editors)).toEqual({
      viewType: "quote",
      resourceId: "q-123",
    })
    expect(matchDeepLink("/quote/q-123/", editors)?.resourceId).toBe("q-123")
  })

  test("legacy pages fall back to page editor; home is not a tab", () => {
    expect(matchDeepLink("/settings/team", editors)).toEqual({
      viewType: "page",
      resourceId: "/settings/team",
    })
    expect(matchDeepLink("/customers", editors)?.viewType).toBe("page")
    expect(matchDeepLink("/customers/c1", editors)?.viewType).toBe("customer")
    expect(matchDeepLink("/", editors)).toBeNull()
  })

  test("buildDeepLink round-trips; stub editors have no route", () => {
    const quote = editors.find((e) => e.viewType === "quote")
    expect(buildDeepLink(quote, "q 1")).toBe("/quote/q%201")
    expect(matchDeepLink("/quote/q%201", editors)?.resourceId).toBe("q 1")
    expect(
      buildDeepLink({ viewType: "stub", displayName: "S" }, "1")
    ).toBeNull()
  })
})

describe("tab host", () => {
  test("open is idempotent per viewType + resourceId and focuses", () => {
    const state = run(
      { type: "open", viewType: "quote", resourceId: "a" },
      { type: "open", viewType: "quote", resourceId: "b" },
      { type: "open", viewType: "quote", resourceId: "a" }
    )
    expect(state.tabs.map((t) => t.id)).toEqual(["quote:a", "quote:b"])
    expect(state.activeTabId).toBe("quote:a")
  })

  test("same resource id under different viewTypes are distinct tabs", () => {
    const state = run(
      { type: "open", viewType: "quote", resourceId: "1" },
      { type: "open", viewType: "customer", resourceId: "1" }
    )
    expect(state.tabs).toHaveLength(2)
  })

  test("focus + close picks neighbor, then empties", () => {
    let state = run(
      { type: "open", viewType: "quote", resourceId: "a" },
      { type: "open", viewType: "quote", resourceId: "b" },
      { type: "open", viewType: "quote", resourceId: "c" },
      { type: "focus", id: "quote:b" }
    )
    expect(state.activeTabId).toBe("quote:b")
    state = tabsReducer(state, { type: "close", id: "quote:b" })
    expect(state.activeTabId).toBe("quote:c")
    state = tabsReducer(state, { type: "close", id: "quote:a" })
    expect(state.activeTabId).toBe("quote:c")
    state = tabsReducer(state, { type: "close", id: "quote:c" })
    expect(state.tabs).toEqual([])
    expect(state.activeTabId).toBeNull()
  })

  test("route sync opens quote tab; home deselects but keeps tabs", () => {
    let state = run({ type: "route", pathname: "/quote/q1", editors })
    expect(state.activeTabId).toBe("quote:q1")
    expect(state.tabs[0]?.title).toBe("Quote q1")
    expect(tabHref(state.tabs[0]!, editors)).toBe("/quote/q1")
    state = tabsReducer(state, { type: "route", pathname: "/", editors })
    expect(state.activeTabId).toBeNull()
    expect(state.tabs).toHaveLength(1)
  })
})

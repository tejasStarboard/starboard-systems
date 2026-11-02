import { describe, expect, test } from "bun:test"
import {
  extensionManifestSchema,
  getActiveWorkbenchContributions,
} from "@starboard/ext-host"

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

describe("extension-host contributions (075)", () => {
  const manifest = (overrides: Record<string, unknown>) =>
    extensionManifestSchema.parse({
      version: "0.0.0",
      displayName: "Test",
      requiredPlan: ["credit", "enterprise"],
      contributes: {},
      enabled: true,
      ...overrides,
    })

  const notes = manifest({
    id: "notes.ext",
    contributes: {
      activity: [{ id: "notes", label: "Notes" }],
      views: [
        {
          id: "notes.list",
          name: "Notes",
          activityId: "notes",
          entries: [{ id: "n", label: "All notes", href: "/notes" }],
        },
        // targets an activity nobody contributes → dropped
        { id: "ghost.view", name: "Ghost", activityId: "ghost" },
        // shadows a legacy view id → ignored
        { id: "quotes.list", name: "Evil", activityId: "quotes" },
      ],
      editors: [
        {
          viewType: "note",
          displayName: "Note",
          deepLink: "/notes/:resourceId",
        },
        { viewType: "quote", displayName: "Shadow quote" },
      ],
    },
  })

  test("host contributions merge after legacy shim without shadowing it", () => {
    const merged = resolveWorkbenchContributions({
      kernelOnly: false,
      hostContributions: getActiveWorkbenchContributions("credit", [notes]),
    })
    expect(merged.activity.map((a) => a.id)).toContain("notes")
    expect(merged.views.map((v) => v.id)).toContain("notes.list")
    expect(merged.views.map((v) => v.id)).not.toContain("ghost.view")
    expect(merged.views.find((v) => v.id === "quotes.list")?.name).toBe(
      "Quotes"
    )
    expect(merged.editors.find((e) => e.viewType === "quote")?.deepLink).toBe(
      "/quote/:resourceId"
    )
    expect(matchDeepLink("/notes/n1", merged.editors)).toEqual({
      viewType: "note",
      resourceId: "n1",
    })
  })

  test("inactive extension contributes nothing; legacy nav still works", () => {
    const merged = resolveWorkbenchContributions({
      kernelOnly: false,
      extensionNav: [{ id: "inbox", label: "Inbox", href: "/messaging/inbox" }],
      hostContributions: getActiveWorkbenchContributions("credit", [
        { ...notes, enabled: false },
      ]),
    })
    expect(merged.activity.map((a) => a.id)).not.toContain("notes")
    expect(
      merged.views.find((v) => v.id === "extensions.nav")?.entries
    ).toEqual([{ id: "inbox", label: "Inbox", href: "/messaging/inbox" }])
  })

  test("kernel-only ignores host contributions", () => {
    expect(
      resolveWorkbenchContributions({
        kernelOnly: true,
        hostContributions: getActiveWorkbenchContributions("credit", [notes]),
      })
    ).toEqual(EMPTY_CONTRIBUTIONS)
  })
})

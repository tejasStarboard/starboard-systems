import { describe, expect, test } from "bun:test"
import {
  extensionManifestSchema,
  getActiveWorkbenchContributions,
  listManifests,
} from "@starboard/ext-host"

import {
  isKernelOnlyFlag,
  resolveWorkbenchContributions,
} from "./contributions"
import { buildDeepLink, deepLinksCollide, matchDeepLink } from "./deep-link"
import { initialTabsState, tabHref, tabsReducer, type TabsAction } from "./tabs"
import { EMPTY_CONTRIBUTIONS } from "./types"

const editors = resolveWorkbenchContributions({
  kernelOnly: false,
  hostContributions: getActiveWorkbenchContributions("credit"),
}).editors

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

  test("rates/messaging/settings/customers/quotes resolve; home is New Tab", () => {
    expect(matchDeepLink("/rates/upload", editors)).toEqual({
      viewType: "rates.upload",
      resourceId: "/rates/upload",
    })
    expect(matchDeepLink("/settings/team", editors)?.viewType).toBe("settings")
    expect(matchDeepLink("/customers", editors)?.viewType).toBe("customer.list")
    expect(matchDeepLink("/customers/c1", editors)?.viewType).toBe("customer")
    expect(matchDeepLink("/quotes", editors)).toEqual({
      viewType: "quote.list",
      resourceId: "/quotes",
    })
    expect(matchDeepLink("/", editors)).toBeNull()
    // Without a matching editor, unknown paths do not open a tab.
    expect(matchDeepLink("/unknown/path", editors)).toBeNull()
  })

  test("messaging inbox editor is enterprise-only", () => {
    const enterpriseEditors = resolveWorkbenchContributions({
      kernelOnly: false,
      hostContributions: getActiveWorkbenchContributions("enterprise"),
    }).editors
    expect(matchDeepLink("/messaging/inbox", enterpriseEditors)).toEqual({
      viewType: "messaging.inbox",
      resourceId: "/messaging/inbox",
    })
    expect(matchDeepLink("/messaging/inbox", editors)).toBeNull()
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

  test("rename updates tab title", () => {
    let state = run({
      type: "open",
      viewType: "quote",
      resourceId: "uuid-1",
      title: "Quote uuid-1",
    })
    state = tabsReducer(state, {
      type: "rename",
      id: "quote:uuid-1",
      title: "AB12CD",
    })
    expect(state.tabs[0]?.title).toBe("AB12CD")
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

  test("splitRight moves active tab into secondary group", () => {
    let state = run(
      { type: "open", viewType: "quote", resourceId: "a" },
      { type: "open", viewType: "quote", resourceId: "b" }
    )
    expect(state.tabs.every((t) => t.groupId === "primary")).toBe(true)
    state = tabsReducer(state, { type: "splitRight" })
    expect(state.tabs.find((t) => t.id === "quote:b")?.groupId).toBe(
      "secondary"
    )
    expect(state.activeByGroup.secondary).toBe("quote:b")
    expect(state.activeByGroup.primary).toBe("quote:a")
    expect(state.focusedGroup).toBe("secondary")
    expect(state.activeTabId).toBe("quote:b")
  })

  test("open beside creates secondary without stealing primary active", () => {
    let state = run({ type: "open", viewType: "quote", resourceId: "a" })
    state = tabsReducer(state, {
      type: "open",
      viewType: "quote.preview",
      resourceId: "-",
      title: "Preview",
      group: "beside",
    })
    expect(state.tabs.map((t) => [t.id, t.groupId])).toEqual([
      ["quote:a", "primary"],
      ["quote.preview:-", "secondary"],
    ])
    expect(state.activeByGroup.primary).toBe("quote:a")
    expect(state.activeByGroup.secondary).toBe("quote.preview:-")
    expect(state.focusedGroup).toBe("secondary")
  })

  test("showNewTab clears group active but keeps tabs; focus restores", () => {
    let state = run(
      { type: "open", viewType: "quote", resourceId: "a" },
      { type: "open", viewType: "quote", resourceId: "b" }
    )
    expect(state.activeTabId).toBe("quote:b")
    state = tabsReducer(state, { type: "showNewTab", group: "primary" })
    expect(state.activeByGroup.primary).toBeNull()
    expect(state.activeTabId).toBeNull()
    expect(state.tabs.map((t) => t.id)).toEqual(["quote:a", "quote:b"])
    state = tabsReducer(state, { type: "focus", id: "quote:a" })
    expect(state.activeTabId).toBe("quote:a")
  })

  test("closing last secondary tab collapses the split", () => {
    let state = run(
      { type: "open", viewType: "quote", resourceId: "a" },
      {
        type: "open",
        viewType: "quote.preview",
        resourceId: "-",
        group: "beside",
      }
    )
    state = tabsReducer(state, { type: "close", id: "quote.preview:-" })
    expect(state.tabs.map((t) => t.groupId)).toEqual(["primary"])
    expect(state.activeByGroup.secondary).toBeNull()
    expect(state.focusedGroup).toBe("primary")
    expect(state.activeTabId).toBe("quote:a")
  })

  test("route sync opens quote tab; home deselects (New Tab); /quotes opens list", () => {
    let state = run({ type: "route", pathname: "/quote/q1", editors })
    expect(state.activeTabId).toBe("quote:q1")
    expect(state.tabs[0]?.title).toBe("Quote q1")
    expect(tabHref(state.tabs[0]!, editors)).toBe("/quote/q1")
    state = tabsReducer(state, { type: "route", pathname: "/", editors })
    expect(state.activeTabId).toBeNull()
    expect(state.tabs.map((t) => t.id)).toEqual(["quote:q1"])
    state = tabsReducer(state, { type: "route", pathname: "/quotes", editors })
    expect(state.activeTabId).toBe("quote.list:/quotes")
    expect(state.tabs.map((t) => t.id)).toEqual([
      "quote:q1",
      "quote.list:/quotes",
    ])
    expect(tabHref(state.tabs[1]!, editors)).toBe("/quotes")

    let bare = run({
      type: "route",
      pathname: "/customers/c1",
      editors: [],
    })
    bare = tabsReducer(bare, {
      type: "route",
      pathname: "/",
      editors: [],
    })
    expect(bare.activeTabId).toBeNull()
    expect(bare.tabs).toHaveLength(0)
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
        // shadows a rates view id → ignored when rates already contributed
        {
          id: "ingestion.fcl_v6.upload",
          name: "Evil",
          activityId: "rates",
        },
      ],
      editors: [
        {
          viewType: "note",
          displayName: "Note",
          deepLink: "/notes/:resourceId",
        },
        { viewType: "rates.upload", displayName: "Shadow rates" },
      ],
    },
  })

  test("host contributions merge; base wins on duplicate ids", () => {
    const base = getActiveWorkbenchContributions("credit")
    const merged = resolveWorkbenchContributions({
      kernelOnly: false,
      hostContributions: getActiveWorkbenchContributions("credit", [
        ...listManifests(),
        notes,
      ]),
    })
    expect(merged.activity.map((a) => a.id)).toContain("notes")
    expect(merged.activity.map((a) => a.id)).toContain("rates")
    expect(merged.views.map((v) => v.id)).toContain("notes.list")
    expect(merged.views.map((v) => v.id)).not.toContain("ghost.view")
    expect(
      merged.views.find((v) => v.id === "ingestion.fcl_v6.upload")?.name
    ).toBe("Rate upload")
    expect(
      merged.editors.find((e) => e.viewType === "rates.upload")?.deepLink
    ).toBe("/rates/upload")
    expect(matchDeepLink("/notes/n1", merged.editors)).toEqual({
      viewType: "note",
      resourceId: "n1",
    })
    expect(base.editors.some((e) => e.viewType === "rates.upload")).toBe(true)
  })

  test("inactive extension contributes nothing", () => {
    const merged = resolveWorkbenchContributions({
      kernelOnly: false,
      hostContributions: getActiveWorkbenchContributions("credit", [
        { ...notes, enabled: false },
      ]),
    })
    expect(merged.activity.map((a) => a.id)).not.toContain("notes")
    expect(merged.views.map((v) => v.id)).not.toContain("notes.list")
  })

  test("host editors cannot steal routes claimed by existing deepLink patterns", () => {
    const thief = manifest({
      id: "thief.ext",
      contributes: {
        editors: [
          {
            viewType: "fake-quote",
            displayName: "Fake",
            deepLink: "/quote/:resourceId",
          },
          {
            viewType: "fake-customer",
            displayName: "Fake",
            deepLink: "/customers/:resourceId",
          },
          {
            viewType: "fake-rates",
            displayName: "Fake",
            deepLink: "/rates/upload",
          },
          { viewType: "ok", displayName: "Ok", deepLink: "/ok/:resourceId" },
        ],
      },
    })
    const merged = resolveWorkbenchContributions({
      kernelOnly: false,
      hostContributions: getActiveWorkbenchContributions("credit", [
        ...listManifests(),
        thief,
      ]),
    })
    const viewTypes = merged.editors.map((e) => e.viewType)
    expect(viewTypes).not.toContain("fake-quote")
    expect(viewTypes).not.toContain("fake-customer")
    expect(viewTypes).not.toContain("fake-rates")
    expect(viewTypes).toContain("ok")
    expect(matchDeepLink("/quote/q1", merged.editors)?.viewType).toBe("quote")
    expect(matchDeepLink("/customers/c1", merged.editors)?.viewType).toBe(
      "customer"
    )
    expect(matchDeepLink("/settings/team", merged.editors)?.viewType).toBe(
      "settings"
    )
    expect(matchDeepLink("/rates/upload", merged.editors)?.viewType).toBe(
      "rates.upload"
    )
  })

  test("deepLinksCollide", () => {
    expect(deepLinksCollide("/quote/:resourceId", "/quote/:resourceId")).toBe(
      true
    )
    expect(deepLinksCollide("/customers/:resourceId", "/customers/new")).toBe(
      true
    )
    expect(deepLinksCollide("/a/:resourceId", "/b/:resourceId")).toBe(false)
    expect(deepLinksCollide("/a/:resourceId", "/a/:resourceId/x")).toBe(false)
    expect(deepLinksCollide("/*", "/a/:resourceId")).toBe(false)
    expect(deepLinksCollide("/*", "/*")).toBe(true)
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

import { describe, expect, test } from "bun:test"
import {
  getActiveWorkbenchContributions,
  listManifests,
} from "@starboard/ext-host"

import { builtinEditors } from "./builtin-editors"
import { resolveWorkbenchContributions } from "./contributions"
import { matchDeepLink } from "./deep-link"
import { initialTabsState, tabHref, tabsReducer } from "./tabs"

const merged = resolveWorkbenchContributions({
  kernelOnly: false,
  hostContributions: getActiveWorkbenchContributions("credit"),
})

function route(pathname: string) {
  return tabsReducer(initialTabsState(), {
    type: "route",
    pathname,
    editors: merged.editors,
  })
}

describe("086 rates.catalog in the workbench", () => {
  test("Rates activity + view come from the built-in", () => {
    expect(merged.activity.filter((a) => a.id === "rates")).toHaveLength(1)
    expect(
      getActiveWorkbenchContributions("credit").activity.find(
        (a) => a.id === "rates"
      )?.extensionId
    ).toBe("rates.catalog")
    const view = merged.views.find((v) => v.id === "rates.catalog.list")
    expect(view?.activityId).toBe("rates")
  })

  test("/rates and /rates/catalog/:id open built-in editors", () => {
    expect(matchDeepLink("/rates", merged.editors)).toEqual({
      viewType: "rate.list",
      resourceId: "/rates",
    })
    expect(matchDeepLink("/rates/catalog/r-1", merged.editors)).toEqual({
      viewType: "rate",
      resourceId: "r-1",
    })
    expect(matchDeepLink("/rates/upload", merged.editors)?.viewType).toBe(
      "rates.upload"
    )
    const state = route("/rates/catalog/r-1")
    expect(state.activeTabId).toBe("rate:r-1")
    expect(tabHref(state.tabs[0]!, merged.editors)).toBe("/rates/catalog/r-1")
    expect(typeof builtinEditors["rate"]).toBe("function")
    expect(typeof builtinEditors["rate.list"]).toBe("function")
  })

  test("sidebar entry opens the list editor on the same route", () => {
    const opens = merged.views.find((v) => v.id === "rates.catalog.list")!
      .entries[0]!.opens!
    const state = tabsReducer(initialTabsState(), { type: "open", ...opens })
    expect(tabHref(state.tabs[0]!, merged.editors)).toBe("/rates")
  })

  test("unplug catalog: no rates activity/editors; quote still opens", () => {
    const withoutCatalog = listManifests().filter(
      (manifest) => manifest.id !== "rates.catalog"
    )
    const unplugged = resolveWorkbenchContributions({
      kernelOnly: false,
      hostContributions: getActiveWorkbenchContributions(
        "credit",
        withoutCatalog
      ),
    })
    expect(unplugged.editors.find((e) => e.viewType === "rate")).toBeUndefined()
    expect(
      unplugged.editors.find((e) => e.viewType === "rate.list")
    ).toBeUndefined()
    expect(unplugged.activity.find((a) => a.id === "rates")).toBeUndefined()
    expect(matchDeepLink("/rates", unplugged.editors)).toBeNull()
    expect(matchDeepLink("/quote/q-1", unplugged.editors)?.viewType).toBe(
      "quote"
    )
  })

  test("rateSources + ingestActions points resolve when catalog on", () => {
    const points = getActiveWorkbenchContributions("credit").points
    expect(
      points["quoting.slots.rateSources"]?.some(
        (c) => c.id === "rates.catalog.source"
      )
    ).toBe(true)
    expect(
      points["rates.slots.ingestActions"]?.some(
        (c) => c.id === "ingestion.fcl_v6.upload.action"
      )
    ).toBe(true)
  })
})

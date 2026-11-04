import { describe, expect, test } from "bun:test"
import {
  getActiveWorkbenchContributions,
  listManifests,
} from "@starboard/ext-host"

import { builtinEditors, builtinPointComponents } from "./builtin-editors"
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

const ratesView = () => merged.views.find((v) => v.id === "rates.catalog.list")!

describe("096 rates.catalog activity IA", () => {
  test("Rates activity + four sidebar entries from the built-in", () => {
    expect(merged.activity.filter((a) => a.id === "rates")).toHaveLength(1)
    expect(
      getActiveWorkbenchContributions("credit").activity.find(
        (a) => a.id === "rates"
      )?.extensionId
    ).toBe("rates.catalog")
    const view = ratesView()
    expect(view.activityId).toBe("rates")
    expect(view.entries.map((e) => e.label)).toEqual([
      "Search Rates",
      "Rate Sheets",
      "Sell Rates",
      "Spot search",
    ])
  })

  test("IA deep links open built-in editors; upload/detail unchanged", () => {
    expect(matchDeepLink("/rates/search", merged.editors)).toEqual({
      viewType: "rate.search",
      resourceId: "/rates/search",
    })
    expect(matchDeepLink("/rates/sheets", merged.editors)).toEqual({
      viewType: "rate.sheets",
      resourceId: "/rates/sheets",
    })
    expect(matchDeepLink("/rates/sell", merged.editors)).toEqual({
      viewType: "rate.sell",
      resourceId: "/rates/sell",
    })
    expect(matchDeepLink("/rates/spot", merged.editors)).toEqual({
      viewType: "rate.spotSearch",
      resourceId: "/rates/spot",
    })
    expect(matchDeepLink("/rates/catalog/r-1", merged.editors)).toEqual({
      viewType: "rate",
      resourceId: "r-1",
    })
    expect(matchDeepLink("/rates/upload", merged.editors)?.viewType).toBe(
      "rates.upload"
    )
    expect(matchDeepLink("/rates", merged.editors)).toBeNull()

    const state = route("/rates/catalog/r-1")
    expect(state.activeTabId).toBe("rate:r-1")
    expect(tabHref(state.tabs[0]!, merged.editors)).toBe("/rates/catalog/r-1")
    expect(typeof builtinEditors["rate"]).toBe("function")
    expect(typeof builtinEditors["rate.sheets"]).toBe("function")
    expect(typeof builtinEditors["rate.search"]).toBe("function")
    expect(typeof builtinEditors["rate.sell"]).toBe("function")
    expect(typeof builtinEditors["rate.spotSearch"]).toBe("function")
  })

  test("sidebar Rate Sheets opens the catalog list on /rates/sheets", () => {
    const opens = ratesView().entries.find(
      (e) => e.id === "rates.catalog.sheets"
    )!.opens!
    const state = tabsReducer(initialTabsState(), { type: "open", ...opens })
    expect(tabHref(state.tabs[0]!, merged.editors)).toBe("/rates/sheets")
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
      unplugged.editors.find((e) => e.viewType === "rate.sheets")
    ).toBeUndefined()
    expect(
      unplugged.editors.find((e) => e.viewType === "rate.search")
    ).toBeUndefined()
    expect(unplugged.activity.find((a) => a.id === "rates")).toBeUndefined()
    expect(matchDeepLink("/rates/sheets", unplugged.editors)).toBeNull()
    expect(matchDeepLink("/quote/q-1", unplugged.editors)?.viewType).toBe(
      "quote"
    )
  })

  test("rateSources + ingestActions + spotSearch points resolve when catalog on", () => {
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
    expect(
      merged.points["rates.slots.ingestActions"]?.some(
        (c) =>
          c.id === "ingestion.fcl_v6.upload.action" &&
          c.component === "rates.ingestUpload"
      )
    ).toBe(true)
    expect(typeof builtinPointComponents["rates.ingestUpload"]).toBe("function")
    expect(points["rates.slots.spotSearch"]?.map((c) => c.id)).toEqual([
      "spot.fake.spotSearch",
      "spot.maersk.spotSearch",
      "spot.cma.spotSearch",
    ])
    expect(
      points["rates.slots.spotSearch"]?.every(
        (c) => c.component === "rates.spotSource"
      )
    ).toBe(true)
    expect(typeof builtinPointComponents["rates.spotSource"]).toBe("function")
  })
})

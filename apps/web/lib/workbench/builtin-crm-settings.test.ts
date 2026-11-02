import { describe, expect, test } from "bun:test"
import { widgets as crmWidgets } from "@starboard/ext-crm-parties"
import { widgets as geoWidgets } from "@starboard/ext-geo-gazetteer"
import { getActiveWorkbenchContributions } from "@starboard/ext-host"
import { SETTINGS_PAGES } from "@starboard/ext-org-settings"

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

describe("078 crm.parties in the workbench", () => {
  test("Customers activity + view come only from the built-in", () => {
    expect(merged.activity.filter((a) => a.id === "customers")).toHaveLength(1)
    const view = merged.views.find((v) => v.id === "crm.parties.list")
    expect(view?.activityId).toBe("customers")
    expect(merged.views.find((v) => v.id === "customers.list")).toBeUndefined()
  })

  test("/customers and /customers/:id open built-in editors", () => {
    expect(matchDeepLink("/customers", merged.editors)).toEqual({
      viewType: "customer.list",
      resourceId: "/customers",
    })
    expect(matchDeepLink("/customers/c-1", merged.editors)).toEqual({
      viewType: "customer",
      resourceId: "c-1",
    })
    const state = route("/customers/c-1")
    expect(state.activeTabId).toBe("customer:c-1")
    expect(tabHref(state.tabs[0]!, merged.editors)).toBe("/customers/c-1")
    expect(typeof builtinEditors["customer"]).toBe("function")
    expect(typeof builtinEditors["customer.list"]).toBe("function")
  })

  test("sidebar entry opens the list editor on the same route", () => {
    const opens = merged.views.find((v) => v.id === "crm.parties.list")!
      .entries[0]!.opens!
    const state = tabsReducer(initialTabsState(), { type: "open", ...opens })
    expect(tabHref(state.tabs[0]!, merged.editors)).toBe("/customers")
  })

  test("unplugged: no customer contributions (no deep-link match)", () => {
    const off = resolveWorkbenchContributions({
      kernelOnly: false,
      hostContributions: getActiveWorkbenchContributions("credit", []),
    })
    expect(off.editors.find((e) => e.viewType === "customer")).toBeUndefined()
    expect(off.activity.find((a) => a.id === "customers")).toBeUndefined()
    expect(matchDeepLink("/customers/c-1", off.editors)).toBeNull()
  })
})

describe("078 org.settings in the workbench", () => {
  test("Settings activity + view come only from the built-in", () => {
    expect(merged.activity.filter((a) => a.id === "settings")).toHaveLength(1)
    const view = merged.views.find((v) => v.id === "org.settings.pages")
    expect(view?.activityId).toBe("settings")
    expect(view?.entries).toHaveLength(SETTINGS_PAGES.length + 1)
    expect(merged.views.find((v) => v.id === "settings.pages")).toBeUndefined()
  })

  test("every settings page + the index have a deep link", () => {
    expect(matchDeepLink("/settings", merged.editors)?.viewType).toBe(
      "settings.index"
    )
    for (const page of SETTINGS_PAGES) {
      expect(matchDeepLink(`/settings/${page.slug}`, merged.editors)).toEqual({
        viewType: "settings",
        resourceId: page.slug,
      })
    }
    const state = route("/settings/team")
    expect(state.activeTabId).toBe("settings:team")
    expect(tabHref(state.tabs[0]!, merged.editors)).toBe("/settings/team")
    expect(typeof builtinEditors["settings"]).toBe("function")
    expect(typeof builtinEditors["settings.index"]).toBe("function")
  })

  test("view entries open settings editors with matching slugs", () => {
    const entries = merged.views.find(
      (v) => v.id === "org.settings.pages"
    )!.entries
    const slugs = entries
      .filter((entry) => entry.opens?.viewType === "settings")
      .map((entry) => entry.opens!.resourceId)
    expect(slugs).toEqual(SETTINGS_PAGES.map((page) => page.slug))
  })

  test("unplugged: no settings contributions", () => {
    const off = resolveWorkbenchContributions({
      kernelOnly: false,
      hostContributions: getActiveWorkbenchContributions("credit", []),
    })
    expect(off.editors.find((e) => e.viewType === "settings")).toBeUndefined()
    expect(off.activity.find((a) => a.id === "settings")).toBeUndefined()
  })
})

describe("078 geo.gazetteer + crm widgets consumed by quote", () => {
  test("packages export the comboboxes quote renders", () => {
    expect(typeof geoWidgets.PortCombobox).toBe("function")
    expect(typeof geoWidgets.AddressCombobox).toBe("function")
    expect(typeof crmWidgets.CustomerCombobox).toBe("function")
  })
})

"use client"

import type { ComponentType } from "react"

import { CompanySettingsForm } from "../components/company-settings-form"
import { PreferencesSettingsForm } from "../components/preferences-settings-form"
import { ProfileSettingsForm } from "../components/profile-settings-form"
import {
  BillingSettings,
  IntegrationsSettings,
} from "../components/settings-context-pages"
import { TeamSettingsForm } from "../components/team-settings-form"
import type { BuiltinEditorProps } from "../host"
import { SETTINGS_SLUG_ALIASES, type SettingsSlug } from "../lib/settings-pages"

const PAGES: Readonly<Record<SettingsSlug, ComponentType>> = {
  company: CompanySettingsForm,
  team: TeamSettingsForm,
  integrations: IntegrationsSettings,
  billing: BillingSettings,
  profile: ProfileSettingsForm,
  preferences: PreferencesSettingsForm,
}

/**
 * `settings` editor: resource id = page slug (`/settings/:resourceId`). An
 * unknown slug is a not-found state, never a blank page.
 */
export function SettingsEditor({ resourceId }: BuiltinEditorProps) {
  // Retired slug (`quote-rules`) → Preferences, scrolled to its new section.
  const alias = Object.hasOwn(SETTINGS_SLUG_ALIASES, resourceId)
    ? SETTINGS_SLUG_ALIASES[resourceId]
    : undefined
  if (alias?.slug === "preferences") {
    return <PreferencesSettingsForm section={alias.section} />
  }
  const Page = Object.hasOwn(PAGES, resourceId)
    ? PAGES[resourceId as SettingsSlug]
    : undefined
  if (!Page) {
    return (
      <p role="alert" className="p-4 text-sm text-destructive">
        Settings page not found.
      </p>
    )
  }
  return <Page />
}

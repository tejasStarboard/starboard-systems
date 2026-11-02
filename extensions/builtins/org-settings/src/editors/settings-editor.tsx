"use client"

import type { ComponentType } from "react"

import { CompanySettingsForm } from "../components/company-settings-form"
import { PreferencesSettingsForm } from "../components/preferences-settings-form"
import { ProfileSettingsForm } from "../components/profile-settings-form"
import { QuoteRulesSettingsForm } from "../components/quote-rules-settings-form"
import {
  BillingSettings,
  IntegrationsSettings,
} from "../components/settings-context-pages"
import { TeamSettingsForm } from "../components/team-settings-form"
import type { BuiltinEditorProps } from "../host"
import type { SettingsSlug } from "../lib/settings-pages"

const PAGES: Readonly<Record<SettingsSlug, ComponentType>> = {
  company: CompanySettingsForm,
  team: TeamSettingsForm,
  integrations: IntegrationsSettings,
  billing: BillingSettings,
  "quote-rules": QuoteRulesSettingsForm,
  profile: ProfileSettingsForm,
  preferences: PreferencesSettingsForm,
}

/**
 * `settings` editor: resource id = page slug (`/settings/:resourceId`). An
 * unknown slug is a not-found state, never a blank page.
 */
export function SettingsEditor({ resourceId }: BuiltinEditorProps) {
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

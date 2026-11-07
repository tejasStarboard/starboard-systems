"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@starboard/lib-ui/components/button"
import { ButtonGroup } from "@starboard/lib-ui/components/button-group"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"
import { toast } from "@starboard/lib-ui/components/toast"

import { QuotePreferencesSection } from "./quote-preferences-section"

/**
 * Preferences page: **App** (theme, per-browser) + **Quote** (org defaults).
 * `section="quote"` (old `/settings/quote-rules` links, `#quote`) scrolls to
 * the Quote section.
 */
export function PreferencesSettingsForm({
  section,
}: {
  section?: "app" | "quote"
}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const target =
      section ?? (window.location.hash === "#quote" ? "quote" : "app")
    if (target === "quote") {
      document
        .getElementById("quote")
        ?.scrollIntoView({ block: "start", behavior: "smooth" })
    }
  }, [section])

  function choose(next: string) {
    setTheme(next)
    toast.add({
      type: "success",
      title: "Theme updated",
      description: `Theme set to ${next}`,
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>
        <p className="text-sm text-muted-foreground">
          App appearance for this browser and quote defaults for this workspace.
        </p>
      </div>

      <section
        id="app"
        aria-labelledby="preferences-app-heading"
        className="space-y-4"
      >
        <h2
          id="preferences-app-heading"
          className="text-lg font-semibold tracking-tight"
        >
          App
        </h2>
        <FieldGroup>
          <Field>
            <FieldLabel>Theme</FieldLabel>
            {!mounted ? (
              <LoadingState size="inline">Loading…</LoadingState>
            ) : (
              <ButtonGroup aria-label="Theme">
                {(["system", "light", "dark"] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={theme === value ? "secondary" : "outline"}
                    size="sm"
                    aria-pressed={theme === value}
                    onClick={() => choose(value)}
                  >
                    {value}
                  </Button>
                ))}
              </ButtonGroup>
            )}
          </Field>
        </FieldGroup>
      </section>

      <QuotePreferencesSection />
    </div>
  )
}

"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"

export function PreferencesSettingsForm() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  function choose(next: string) {
    setTheme(next)
    setMessage(`Theme set to ${next}`)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Personal appearance settings for this browser.
        </p>
      </div>

      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <FieldGroup>
          <Field>
            <FieldLabel>Theme</FieldLabel>
            {!mounted ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(["system", "light", "dark"] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={theme === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => choose(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            )}
          </Field>
        </FieldGroup>
      </section>
    </div>
  )
}

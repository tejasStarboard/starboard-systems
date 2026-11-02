"use client"

import { useEffect, useState } from "react"

import { CarrierCredentialsPanel } from "./carrier-credentials-panel"
import { ConnectOutlook } from "./connect-outlook"
import type { SettingsContext } from "../lib/settings-context"

const PLAN_LABELS = {
  credit: "Credit",
  enterprise: "Enterprise",
} as const

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; context: SettingsContext }

/** Loads `/api/settings/context` (plan + active integrations) for billing / integrations. */
function useSettingsContext(): State {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch("/api/settings/context", {
          signal: controller.signal,
        })
        const body = (await response.json().catch(() => null)) as
          (SettingsContext & { error?: string }) | null
        if (!response.ok || !body?.plan) {
          setState({
            status: "error",
            message: body?.error ?? "Unable to load settings.",
          })
          return
        }
        setState({ status: "ready", context: body })
      } catch {
        if (!controller.signal.aborted) {
          setState({ status: "error", message: "Unable to load settings." })
        }
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  return state
}

function Pending({ state }: { state: State }) {
  if (state.status === "error") {
    return (
      <p role="alert" className="p-6 text-sm text-destructive">
        {state.message}
      </p>
    )
  }
  return <p className="p-6 text-xs text-muted-foreground">Loading…</p>
}

export function BillingSettings() {
  const state = useSettingsContext()
  if (state.status !== "ready") return <Pending state={state} />

  return (
    <div className="p-6">
      <h1 className="text-sm font-medium">Billing</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Current plan:{" "}
        <span className="font-medium text-foreground">
          {PLAN_LABELS[state.context.plan]}
        </span>
      </p>
    </div>
  )
}

export function IntegrationsSettings() {
  const state = useSettingsContext()
  if (state.status !== "ready") return <Pending state={state} />

  const { integrations } = state.context

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-medium">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect providers for extensions already active for your organization.
        </p>
      </div>

      <CarrierCredentialsPanel />

      {integrations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No connection-based integrations are active for this organization.
        </p>
      ) : (
        <ul className="divide-y divide-border border">
          {integrations.map((integration) => (
            <li
              key={integration.extensionId}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {integration.displayName}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {integration.extensionId}
                </span>
              </div>
              <ConnectOutlook initialStatus={integration.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

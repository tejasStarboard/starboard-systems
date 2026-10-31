"use client"

import { useState } from "react"

import { Button } from "@workspace/ui/components/button"

type ConnectionStatus = {
  status: string
  authUrl?: string | null
}

export function ConnectOutlook({ initialStatus }: { initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch(
        "/api/extensions/messaging.msgraph/connection",
        { method: "POST" }
      )
      const payload = (await response.json().catch(() => null)) as
        (ConnectionStatus & { error?: string }) | null
      if (!response.ok) {
        setError(payload?.error ?? "Connect failed")
        return
      }
      setStatus(payload?.status ?? "connected")
    } catch {
      setError("Connect failed")
    } finally {
      setPending(false)
    }
  }

  async function disconnect() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch(
        "/api/extensions/messaging.msgraph/connection",
        { method: "DELETE" }
      )
      const payload = (await response.json().catch(() => null)) as
        (ConnectionStatus & { error?: string }) | null
      if (!response.ok) {
        setError(payload?.error ?? "Disconnect failed")
        return
      }
      setStatus(payload?.status ?? "disconnected")
    } catch {
      setError("Disconnect failed")
    } finally {
      setPending(false)
    }
  }

  const connected = status === "connected"

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">Outlook: {status}</span>
        {connected ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={disconnect}
          >
            {pending ? "Working…" : "Disconnect Outlook"}
          </Button>
        ) : (
          <Button type="button" size="sm" disabled={pending} onClick={connect}>
            {pending ? "Connecting…" : "Connect Outlook"}
          </Button>
        )}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

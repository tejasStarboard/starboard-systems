"use client"

import { useState } from "react"

import { Button } from "@starboard/lib-ui/components/button"
import { toast } from "@starboard/lib-ui/components/toast"

import { extensionApiPath } from "@/lib/extension-api-path"

const MESSAGING_EXTENSION_ID = "messaging.msgraph"

type ConnectionStatus = {
  status: string
  authUrl?: string | null
}

export function ConnectOutlook({ initialStatus }: { initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus)
  const [pending, setPending] = useState(false)

  async function connect() {
    setPending(true)
    try {
      const response = await fetch(
        extensionApiPath(MESSAGING_EXTENSION_ID, "connection"),
        { method: "POST" }
      )
      const payload = (await response.json().catch(() => null)) as
        (ConnectionStatus & { error?: string }) | null
      if (!response.ok) {
        toast.add({
          type: "error",
          title: "Unable to connect Outlook",
          description: payload?.error ?? "Something went wrong. Try again.",
        })
        return
      }

      const authUrl = payload?.authUrl?.trim()
      if (authUrl) {
        // Live: absolute Azure authorize URL. Stub: relative shell callback.
        window.location.assign(authUrl)
        return
      }

      setStatus(payload?.status ?? "connecting")
    } catch {
      toast.add({
        type: "error",
        title: "Unable to connect Outlook",
        description: "Something went wrong. Try again.",
      })
    } finally {
      setPending(false)
    }
  }

  async function disconnect() {
    setPending(true)
    try {
      const response = await fetch(
        extensionApiPath(MESSAGING_EXTENSION_ID, "connection"),
        { method: "DELETE" }
      )
      const payload = (await response.json().catch(() => null)) as
        (ConnectionStatus & { error?: string }) | null
      if (!response.ok) {
        toast.add({
          type: "error",
          title: "Unable to disconnect Outlook",
          description: payload?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      setStatus(payload?.status ?? "disconnected")
      toast.add({ type: "success", title: "Outlook disconnected" })
    } catch {
      toast.add({
        type: "error",
        title: "Unable to disconnect Outlook",
        description: "Something went wrong. Try again.",
      })
    } finally {
      setPending(false)
    }
  }

  const connected = status === "connected"

  return (
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
  )
}

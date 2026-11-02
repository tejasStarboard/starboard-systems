"use client"

import { useCallback, useState } from "react"

import { toast } from "@starboard/lib-ui/components/toast"

import { extensionApiPath } from "@/lib/extension-api-path"
import { useExtensionJob } from "@/hooks/use-extension-job"

const MESSAGING_EXTENSION_ID = "messaging.msgraph"

export type InboxMessage = {
  id: string
  subject: string
  fromAddress: string
  bodyPreview: string
}

export function useMessagingInbox(initialMessages: InboxMessage[]) {
  const [messages, setMessages] = useState(initialMessages)
  const { pending: syncPending, job, enqueue } = useExtensionJob()

  const syncInbox = useCallback(async () => {
    const result = await enqueue({
      extensionId: MESSAGING_EXTENSION_ID,
      failTitle: "Sync failed",
    })
    if (!result.ok) return

    const listResponse = await fetch(
      extensionApiPath(MESSAGING_EXTENSION_ID, "messages")
    )
    if (listResponse.ok) {
      const listed = (await listResponse.json()) as InboxMessage[]
      setMessages(listed)
    }
    toast.add({ type: "success", title: "Inbox sync started" })
  }, [enqueue])

  const sendMessage = useCallback(
    async (values: { toAddress: string; subject: string; body: string }) => {
      try {
        const response = await fetch(
          extensionApiPath(MESSAGING_EXTENSION_ID, "send"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          }
        )
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        if (!response.ok) {
          toast.add({
            type: "error",
            title: "Send failed",
            description: payload?.error ?? "Something went wrong. Try again.",
          })
          return { ok: false as const }
        }
        toast.add({ type: "success", title: "Message sent" })
        return { ok: true as const }
      } catch {
        toast.add({
          type: "error",
          title: "Send failed",
          description: "Something went wrong. Try again.",
        })
        return { ok: false as const }
      }
    },
    []
  )

  return { messages, syncPending, job, syncInbox, sendMessage }
}

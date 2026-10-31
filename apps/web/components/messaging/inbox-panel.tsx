"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@workspace/ui/components/button"

type Message = {
  id: string
  subject: string
  fromAddress: string
  bodyPreview: string
}

export function InboxPanel({
  initialMessages,
}: {
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<{ workflowId: string; runId: string } | null>(
    null
  )
  const [toAddress, setToAddress] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sendStatus, setSendStatus] = useState<string | null>(null)

  async function syncInbox() {
    setPending(true)
    setError(null)
    setJob(null)
    try {
      const response = await fetch("/api/extensions/messaging.msgraph/jobs", {
        method: "POST",
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        workflowId?: string
        runId?: string
      } | null
      if (!response.ok) {
        setError(payload?.error ?? "Sync failed")
        return
      }
      if (!payload?.workflowId || !payload.runId) {
        setError("Unexpected sync response")
        return
      }
      setJob({ workflowId: payload.workflowId, runId: payload.runId })

      const listResponse = await fetch(
        "/api/extensions/messaging.msgraph/messages"
      )
      if (listResponse.ok) {
        const listed = (await listResponse.json()) as Message[]
        setMessages(listed)
      }
    } catch {
      setError("Sync failed")
    } finally {
      setPending(false)
    }
  }

  async function sendReply(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setSendStatus(null)
    try {
      const response = await fetch("/api/extensions/messaging.msgraph/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toAddress, subject, body }),
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        status?: string
        id?: string
      } | null
      if (!response.ok) {
        setError(payload?.error ?? "Send failed")
        return
      }
      setSendStatus(payload?.status ?? "sent")
    } catch {
      setError("Send failed")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={syncInbox}
          className="w-fit"
        >
          {pending ? "Working…" : "Sync inbox"}
        </Button>
        {job ? (
          <p className="font-mono text-xs text-muted-foreground">
            Accepted 202 — workflowId={job.workflowId} runId={job.runId}
          </p>
        ) : null}
      </div>

      <ul className="divide-y divide-border border">
        {messages.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted-foreground">
            No messages yet. Connect Outlook and sync.
          </li>
        ) : (
          messages.map((message) => (
            <li key={message.id} className="flex flex-col gap-1 px-4 py-3">
              <span className="text-sm font-medium">{message.subject}</span>
              <span className="text-xs text-muted-foreground">
                From {message.fromAddress}
              </span>
              <span className="text-sm text-muted-foreground">
                {message.bodyPreview}
              </span>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={sendReply} className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Send reply</h2>
        <input
          className="border px-3 py-2 text-sm"
          placeholder="To"
          value={toAddress}
          onChange={(event) => setToAddress(event.target.value)}
          required
        />
        <input
          className="border px-3 py-2 text-sm"
          placeholder="Subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
        />
        <textarea
          className="min-h-24 border px-3 py-2 text-sm"
          placeholder="Body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </Button>
        {sendStatus ? (
          <p className="text-xs text-muted-foreground">Sent: {sendStatus}</p>
        ) : null}
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

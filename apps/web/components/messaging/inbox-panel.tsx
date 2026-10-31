"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { Textarea } from "@starboard/lib-ui/components/textarea"
import { toast } from "@starboard/lib-ui/components/toast"

import {
  sendMessageFormSchema,
  type SendMessageFormValues,
} from "@/lib/domain/settings/settings-forms.schema"
import { toastFormErrors } from "@/lib/form-toast"
import { extensionApiPath } from "@/lib/extension-api-path"

const MESSAGING_EXTENSION_ID = "messaging.msgraph"

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
  const [syncPending, setSyncPending] = useState(false)
  const [job, setJob] = useState<{ workflowId: string; runId: string } | null>(
    null
  )

  const form = useForm<SendMessageFormValues>({
    resolver: zodResolver(sendMessageFormSchema),
    defaultValues: { toAddress: "", subject: "", body: "" },
  })

  async function syncInbox() {
    setSyncPending(true)
    setJob(null)
    try {
      const response = await fetch(
        extensionApiPath(MESSAGING_EXTENSION_ID, "jobs"),
        {
          method: "POST",
        }
      )
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        workflowId?: string
        runId?: string
      } | null
      if (!response.ok) {
        toast.add({
          type: "error",
          title: "Sync failed",
          description: payload?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      if (!payload?.workflowId || !payload.runId) {
        toast.add({
          type: "error",
          title: "Sync failed",
          description: "Unexpected sync response.",
        })
        return
      }
      setJob({ workflowId: payload.workflowId, runId: payload.runId })

      const listResponse = await fetch(
        extensionApiPath(MESSAGING_EXTENSION_ID, "messages")
      )
      if (listResponse.ok) {
        const listed = (await listResponse.json()) as Message[]
        setMessages(listed)
      }
      toast.add({ type: "success", title: "Inbox sync started" })
    } catch {
      toast.add({
        type: "error",
        title: "Sync failed",
        description: "Something went wrong. Try again.",
      })
    } finally {
      setSyncPending(false)
    }
  }

  async function onSend(values: SendMessageFormValues) {
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
        status?: string
      } | null
      if (!response.ok) {
        toast.add({
          type: "error",
          title: "Send failed",
          description: payload?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      form.reset({ toAddress: "", subject: "", body: "" })
      toast.add({ type: "success", title: "Message sent" })
    } catch {
      toast.add({
        type: "error",
        title: "Send failed",
        description: "Something went wrong. Try again.",
      })
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          disabled={syncPending}
          onClick={syncInbox}
          className="w-fit"
        >
          {syncPending ? "Working…" : "Sync inbox"}
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

      <form
        onSubmit={form.handleSubmit(onSend, toastFormErrors)}
        className="flex flex-col gap-3"
      >
        <h2 className="text-sm font-medium">Send reply</h2>
        <FieldGroup className="gap-3">
          <Controller
            control={form.control}
            name="toAddress"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="send-to">To</FieldLabel>
                <Input
                  id="send-to"
                  placeholder="To"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="subject"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="send-subject">Subject</FieldLabel>
                <Input
                  id="send-subject"
                  placeholder="Subject"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="body"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="send-body">Body</FieldLabel>
                <Textarea
                  id="send-body"
                  className="min-h-24"
                  placeholder="Body"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  )
}

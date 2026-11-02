"use client"

import { zodResolver } from "@hookform/resolvers/zod"
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

import {
  useMessagingInbox,
  type InboxMessage,
} from "@/hooks/use-messaging-inbox"
import {
  sendMessageFormSchema,
  type SendMessageFormValues,
} from "@/lib/domain/messaging/messaging-forms.schema"
import { toastFormErrors } from "@/lib/form-toast"

export function InboxPanel({
  initialMessages,
}: {
  initialMessages: InboxMessage[]
}) {
  const { messages, syncPending, job, syncInbox, sendMessage } =
    useMessagingInbox(initialMessages)

  const form = useForm<SendMessageFormValues>({
    resolver: zodResolver(sendMessageFormSchema),
    defaultValues: { toAddress: "", subject: "", body: "" },
  })

  async function onSend(values: SendMessageFormValues) {
    const result = await sendMessage(values)
    if (result.ok) {
      form.reset({ toAddress: "", subject: "", body: "" })
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          disabled={syncPending}
          onClick={() => void syncInbox()}
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
                <FieldLabel htmlFor="toAddress">To</FieldLabel>
                <Input
                  id="toAddress"
                  type="email"
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
                <FieldLabel htmlFor="subject">Subject</FieldLabel>
                <Input
                  id="subject"
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
                <FieldLabel htmlFor="body">Body</FieldLabel>
                <Textarea
                  id="body"
                  rows={5}
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>
        <Button
          type="submit"
          className="w-fit"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  )
}

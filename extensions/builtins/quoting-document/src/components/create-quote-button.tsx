"use client"

import { useTransition } from "react"
import { PlusIcon } from "@phosphor-icons/react"

import { Button } from "@starboard/lib-ui/components/button"
import { toast } from "@starboard/lib-ui/components/toast"

import type { BuiltinHost } from "../host"

interface CreateQuoteButtonProps extends React.ComponentProps<typeof Button> {
  host: BuiltinHost
  onCreated?: () => void
}

export function CreateQuoteButton({
  host,
  onCreated,
  size,
  children,
  ...props
}: CreateQuoteButtonProps) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type={props.type ?? "button"}
      size={size}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const response = await fetch("/api/quotes", { method: "POST" })
          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as {
              error?: string
            } | null
            toast.add({
              type: "error",
              title: "Unable to create quote",
              description: payload?.error ?? "Something went wrong. Try again.",
            })
            return
          }

          const payload = (await response.json()) as {
            id: string
            quoteId: string
          }
          host.openEditor({
            viewType: "quote",
            resourceId: payload.id,
            title: payload.quoteId,
          })
          onCreated?.()
        })
      }}
      {...props}
    >
      {children ?? (
        <>
          <PlusIcon data-icon="inline-start" />
          {pending ? "Creating..." : "New quote"}
        </>
      )}
    </Button>
  )
}

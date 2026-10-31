"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { PlusIcon } from "@phosphor-icons/react"

import { Button } from "@starboard/lib-ui/components/button"
import { toast } from "@starboard/lib-ui/components/toast"

export function CreateQuoteButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
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

          const payload = (await response.json()) as { id: string }
          router.push(`/quote/${payload.id}`)
          router.refresh()
        })
      }}
    >
      <PlusIcon data-icon="inline-start" />
      {pending ? "Creating..." : "New quote"}
    </Button>
  )
}

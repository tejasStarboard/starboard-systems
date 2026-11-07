import { toast } from "@starboard/lib-ui/components/toast"

import type { BuiltinHost } from "./host"

export type NewTabCommandContext = {
  openEditor: BuiltinHost["openEditor"]
}

export type NewTabCommandHandler = (
  context: NewTabCommandContext
) => void | Promise<void>

/** Client handlers for `workbench.newTab` `command` ids from this built-in. */
export const newTabCommands: Readonly<
  Record<"quoting.document.newQuote", NewTabCommandHandler>
> = {
  "quoting.document.newQuote": async ({ openEditor }) => {
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
    openEditor({
      viewType: "quote",
      resourceId: payload.id,
      title: payload.quoteId,
    })
  },
}

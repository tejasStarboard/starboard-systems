"use client"

import { useState } from "react"
import { DownloadSimpleIcon } from "@phosphor-icons/react"

import type {
  CommandsSlotProps,
  SlotComponentProps,
} from "@starboard/ext-quoting-document/slots"
import { DropdownMenuItem } from "@starboard/lib-ui/components/dropdown-menu"

/**
 * `quoting.pdf.export` → `quoting.commands`.
 * Host mounts this inside the Preview split-button menu; gate with
 * `exportAllowed` (review | sent | win | loss).
 * `quoteId` is the persisted row UUID (not the human quote number).
 */
export function ExportPdfButton({
  quoteId,
  exportAllowed,
}: SlotComponentProps<CommandsSlotProps>) {
  const [pending, setPending] = useState(false)

  async function onExport() {
    if (!exportAllowed || pending || !quoteId) return
    setPending(true)
    try {
      const response = await fetch(
        `/api/quotes/${encodeURIComponent(quoteId)}/pdf`
      )
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? `Export failed (${response.status})`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      const disposition = response.headers.get("Content-Disposition")
      const match = disposition?.match(/filename="([^"]+)"/)
      anchor.href = url
      anchor.download = match?.[1] ?? `quote-${quoteId}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      window.alert(
        error instanceof Error ? error.message : "Unable to export PDF"
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <DropdownMenuItem
      disabled={!exportAllowed || pending || !quoteId}
      onClick={() => void onExport()}
      data-testid="quoting-pdf-export"
      title={
        exportAllowed
          ? "Export PDF"
          : "Export available when status is review, sent, win, or loss"
      }
    >
      <DownloadSimpleIcon />
      {pending ? "Exporting…" : "Export PDF"}
    </DropdownMenuItem>
  )
}

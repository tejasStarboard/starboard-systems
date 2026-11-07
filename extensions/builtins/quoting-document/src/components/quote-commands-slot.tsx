"use client"

import { useWatch } from "react-hook-form"

import type { QuoteStatus } from "@starboard/lib-contracts"

import { canRunExportCommand } from "../lib/quote-stage"
import { QuoteSlot } from "../slots/slot-host"
import { QUOTING_SLOTS, type CommandsSlotProps } from "../slots/types"
import type { QuoteFormLayoutProps } from "./quote-form-layout-props"

/**
 * `quoting.commands` host: menu items for the Preview split button (PDF in
 * 083). Empty until a contributor mounts. Passes `exportAllowed` so
 * contributors can gate.
 */
export function QuoteCommandsSlot({
  props,
  className,
}: {
  props: QuoteFormLayoutProps
  className?: string
}) {
  const status = (useWatch({ control: props.control, name: "status" }) ??
    "draft") as QuoteStatus
  // API paths need the persisted row UUID (`id`), not the human `quoteId`.
  const resourceId = (useWatch({ control: props.control, name: "id" }) ??
    "") as string
  const slotProps: CommandsSlotProps = {
    quoteId: resourceId,
    status,
    exportAllowed: canRunExportCommand(status),
  }
  return (
    <div
      data-quote-commands=""
      data-export-allowed={slotProps.exportAllowed ? "true" : "false"}
      className={className}
    >
      <QuoteSlot point={QUOTING_SLOTS.commands} props={slotProps} />
    </div>
  )
}

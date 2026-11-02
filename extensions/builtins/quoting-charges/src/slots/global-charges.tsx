"use client"

import type {
  ChargeTableSlotProps,
  SlotComponentProps,
} from "@starboard/ext-quoting-document/slots"

import { GlobalChargesEditor } from "../components/global-charges-editor"

/** `quoting.charges.globals` → `quoting.slots.chargeTable`: quote-wide charges. */
export function GlobalCharges({
  control,
  register,
  currencyCode,
}: SlotComponentProps<ChargeTableSlotProps>) {
  return (
    <GlobalChargesEditor
      control={control}
      register={register}
      currencyCode={currencyCode}
    />
  )
}

"use client"

import type { BuiltinEditorProps } from "../host"
import { RatesList } from "../components/rates-list"

/** `rate.sheets` editor: catalog browse/create under Rate Sheets (`/rates/sheets`). */
export function RateSheetsEditor({ host }: BuiltinEditorProps) {
  return <RatesList host={host} />
}

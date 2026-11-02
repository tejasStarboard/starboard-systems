"use client"

import type { BuiltinEditorProps } from "../host"
import { RatesList } from "../components/rates-list"

/** `rate.list` editor: catalog browse/create (owns `/rates`). */
export function RateListEditor({ host }: BuiltinEditorProps) {
  return <RatesList host={host} />
}

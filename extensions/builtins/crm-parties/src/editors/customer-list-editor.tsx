"use client"

import type { BuiltinEditorProps } from "../host"
import { CustomersList } from "../components/customers-list"

/** `customer.list` editor: searchable customers + contacts (formerly `/customers`). */
export function CustomerListEditor({ host }: BuiltinEditorProps) {
  return <CustomersList host={host} />
}

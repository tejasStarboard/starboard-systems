"use client"

import type { BuiltinEditorProps } from "../host"

/**
 * Titled shell for Search / Sell / Spot until 097–099 fill product UI.
 */
export function RatesPlaceholderEditor({ title }: BuiltinEditorProps) {
  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h1 className="text-sm font-medium">{title}</h1>
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </div>
  )
}

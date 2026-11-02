import type { ComponentType } from "react"

import { ChargeTable } from "./slots/charge-table"

export { manifest, type BuiltinManifest } from "./manifest"

/**
 * UI factories for this extension's contributions into `quoting.document`'s
 * slots, keyed by contribution id (see `manifest.ts`). The kernel merges every
 * package's `pointComponents`; the quote slot host resolves by id.
 */
export const pointComponents: Readonly<
  Record<"quoting.charges.table", ComponentType<never>>
> = {
  "quoting.charges.table": ChargeTable as ComponentType<never>,
}

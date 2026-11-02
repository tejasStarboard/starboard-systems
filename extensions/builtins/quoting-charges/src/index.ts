import type { ComponentType } from "react"

import { ChargeTable } from "./slots/charge-table"
import { GlobalCharges } from "./slots/global-charges"

export { manifest, type BuiltinManifest } from "./manifest"

/**
 * UI factories for this extension's contributions into `quoting.document`'s
 * slots, keyed by contribution id (see `manifest.ts`). The kernel merges every
 * package's `pointComponents`; the quote slot host resolves by id.
 */
export const pointComponents: Readonly<
  Record<
    "quoting.charges.table" | "quoting.charges.globals",
    ComponentType<never>
  >
> = {
  "quoting.charges.table": ChargeTable as ComponentType<never>,
  "quoting.charges.globals": GlobalCharges as ComponentType<never>,
}

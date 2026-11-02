import type { ComponentType } from "react"

import { IncotermFields } from "./slots/incoterm-fields"

export { manifest, type BuiltinManifest } from "./manifest"

/**
 * UI factories for contributions into `quoting.document` points, keyed by
 * contribution id. Kernel merges into `builtinPointComponents`.
 */
export const pointComponents: Readonly<
  Record<"quoting.incoterm.fields", ComponentType<never>>
> = {
  "quoting.incoterm.fields": IncotermFields as ComponentType<never>,
}

import type { ComponentType } from "react"

import { MarkupFooter } from "./slots/markup-footer"

export { manifest, type BuiltinManifest } from "./manifest"

/**
 * UI factories for contributions into `quoting.document` points, keyed by
 * contribution id. Kernel merges into `builtinPointComponents`.
 */
export const pointComponents: Readonly<
  Record<"quoting.markup.footer", ComponentType<never>>
> = {
  "quoting.markup.footer": MarkupFooter as ComponentType<never>,
}

import type { ComponentType } from "react"

import { EmailPreview } from "./slots/email-preview"

export { manifest, type BuiltinManifest } from "./manifest"

/**
 * UI factories for contributions into `quoting.document` points, keyed by
 * contribution id. Kernel merges into `builtinPointComponents`.
 * (HTML rendering is server-only: see `./server`.)
 */
export const pointComponents: Readonly<
  Record<"quoting.email.preview", ComponentType<never>>
> = {
  "quoting.email.preview": EmailPreview as ComponentType<never>,
}

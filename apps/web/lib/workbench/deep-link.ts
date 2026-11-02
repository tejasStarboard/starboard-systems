import type { WorkbenchEditor } from "./types"

const RESOURCE_SEGMENT = ":resourceId"
const WILDCARD = "/*"

function normalizePath(pathname: string): string {
  const path = pathname.split(/[?#]/)[0] ?? "/"
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1)
  return path || "/"
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export type DeepLinkMatch = { viewType: string; resourceId: string }

/** Resolve a pathname to `{ viewType, resourceId }` via editor deep-link patterns. */
export function matchDeepLink(
  pathname: string,
  editors: readonly WorkbenchEditor[]
): DeepLinkMatch | null {
  const path = normalizePath(pathname)
  if (path === "/") return null

  const segments = path.split("/").filter(Boolean)

  for (const editor of editors) {
    const pattern = editor.deepLink
    if (!pattern || pattern === WILDCARD) continue
    const patternSegments = pattern.split("/").filter(Boolean)
    if (patternSegments.length !== segments.length) continue

    let resourceId: string | null = null
    const matches = patternSegments.every((part, index) => {
      if (part === RESOURCE_SEGMENT) {
        resourceId = safeDecode(segments[index] ?? "")
        return resourceId.length > 0
      }
      return part === segments[index]
    })
    if (matches && resourceId) {
      return { viewType: editor.viewType, resourceId }
    }
  }

  const fallback = editors.find((editor) => editor.deepLink === WILDCARD)
  return fallback ? { viewType: fallback.viewType, resourceId: path } : null
}

/** Inverse of `matchDeepLink`; null for stub editors (no route). */
export function buildDeepLink(
  editor: WorkbenchEditor | undefined,
  resourceId: string
): string | null {
  const pattern = editor?.deepLink
  if (!pattern) return null
  if (pattern === WILDCARD) return resourceId
  return pattern.replace(RESOURCE_SEGMENT, encodeURIComponent(resourceId))
}

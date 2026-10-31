/** Browser / relative BFF path for an extension API segment. */
export function extensionApiPath(
  extensionId: string,
  ...segments: string[]
): string {
  const parts = segments
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
  const suffix = parts.length > 0 ? `/${parts.join("/")}` : ""
  return `/api/extensions/${encodeURIComponent(extensionId)}${suffix}`
}

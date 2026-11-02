/**
 * Deep-link anchor (086). `/rates/catalog/:id` is claimed by the
 * `rates.catalog` `rate` editor; when that built-in is active the editor group
 * mounts the real editor and ignores these children. Only when it is inactive
 * (unplugged / rolled out off) does this fallback render.
 */
export default function RateDeepLinkPage() {
  return (
    <p role="alert" className="p-4 text-sm text-muted-foreground">
      Rates are unavailable: the rates catalog extension is not active for this
      organization.
    </p>
  )
}

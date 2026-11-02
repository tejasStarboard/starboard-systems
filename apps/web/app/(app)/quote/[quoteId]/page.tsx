/**
 * Deep-link anchor (077). `/quote/:id` is claimed by the `quoting.document`
 * `quote` editor contribution; when that built-in is active the editor group
 * mounts the real editor and ignores these children. Only when it is inactive
 * (unplugged / rolled out off) does this fallback render.
 */
export default function QuoteDeepLinkPage() {
  return (
    <p role="alert" className="p-4 text-sm text-muted-foreground">
      The quote editor is unavailable: the Quote documents extension is not
      active for this organization.
    </p>
  )
}

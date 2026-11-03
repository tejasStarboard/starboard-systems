/**
 * Deep-link anchor. Catalog list CRUD moved under `/rates/sheets` (096).
 * This path is no longer claimed by an editor; keep a fallback so direct
 * hits still explain when the rates catalog extension is inactive.
 */
export default function RatesDeepLinkPage() {
  return (
    <p role="alert" className="p-4 text-sm text-muted-foreground">
      Rates are unavailable: the rates catalog extension is not active for this
      organization.
    </p>
  )
}

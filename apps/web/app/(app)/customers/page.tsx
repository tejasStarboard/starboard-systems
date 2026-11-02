/**
 * Deep-link anchor (078). `/customers` is claimed by the `crm.parties`
 * `customer.list` editor; when that built-in is active the editor group mounts
 * the real editor and ignores these children. Only when it is inactive
 * (unplugged / rolled out off) does this fallback render.
 */
export default function CustomersDeepLinkPage() {
  return (
    <p role="alert" className="p-4 text-sm text-muted-foreground">
      Customers are unavailable: the CRM parties extension is not active for
      this organization.
    </p>
  )
}

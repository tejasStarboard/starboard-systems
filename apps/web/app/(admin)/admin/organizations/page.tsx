import { OrgSearchPanel } from "@/components/admin/org-search-panel"

export default function AdminOrganizationsPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-sm font-medium">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          Search customer orgs and switch into their shell context. Exit from
          the banner in the app.
        </p>
      </div>
      <OrgSearchPanel />
    </div>
  )
}

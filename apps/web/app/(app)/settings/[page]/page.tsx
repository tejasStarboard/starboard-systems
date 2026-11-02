/**
 * Deep-link anchor (078). `/settings/:page` is claimed by the `org.settings`
 * `settings` editor (company, team, profile, …); see `settings/page.tsx`.
 * Static `settings/customers` redirect shims below take precedence.
 */
export default function SettingsPageDeepLinkPage() {
  return (
    <p role="alert" className="p-4 text-sm text-muted-foreground">
      Settings are unavailable: the Organization settings extension is not
      active for this organization.
    </p>
  )
}

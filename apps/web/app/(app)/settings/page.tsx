/**
 * Deep-link anchor (078). `/settings` is claimed by the `org.settings`
 * `settings.index` editor; when that built-in is active the editor group
 * mounts the real editor and ignores these children. Only when it is inactive
 * (unplugged / rolled out off) does this fallback render.
 */
export default function SettingsDeepLinkPage() {
  return (
    <p role="alert" className="p-4 text-sm text-muted-foreground">
      Settings are unavailable: the Organization settings extension is not
      active for this organization.
    </p>
  )
}

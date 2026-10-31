import { CommonBetaSettingsPanel } from "@/components/admin/common-beta-settings-panel"
import { getPlatformManager } from "@/lib/domain/platform/platform.manager"

export default async function AdminSettingsPage() {
  const organizations = await getPlatformManager().getCommonBetaOrganizations()

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-sm font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Common beta organization list. Extensions set to “Common beta list”
          use these orgs.
        </p>
      </div>
      <CommonBetaSettingsPanel initialOrganizations={organizations} />
    </div>
  )
}

import { ExtensionRolloutPanel } from "@/components/admin/extension-rollout-panel"
import { getPlatformManager } from "@/lib/domain/platform/platform.manager"
import { listRegisteredExtensions } from "@/lib/extensions"
import { parseRolloutMode } from "@starboard/ext-host"

export default async function AdminExtensionsPage() {
  const manifests = listRegisteredExtensions()
  const manager = getPlatformManager()
  const rollouts = await manager.getRolloutMap()

  const customOrgIds = [
    ...new Set(
      [...rollouts.values()]
        .filter((state) => state.mode === "beta")
        .flatMap((state) => state.organizationIds)
    ),
  ]
  const orgsById = new Map(
    (await manager.getOrganizationsByIds(customOrgIds)).map((org) => [
      org.id,
      org,
    ])
  )

  const extensions = manifests.map((manifest) => {
    const state = rollouts.get(manifest.id)
    const mode = parseRolloutMode(state?.mode)
    const organizationIds =
      mode === "beta" ? [...(state?.organizationIds ?? [])] : []
    return {
      id: manifest.id,
      displayName: manifest.displayName,
      enabled: manifest.enabled === true,
      requiredPlan: [...manifest.requiredPlan],
      mode,
      organizations: organizationIds.map(
        (id) =>
          orgsById.get(id) ?? {
            id,
            name: id,
            slug: id,
          }
      ),
    }
  })

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-sm font-medium">Extension rollout</h1>
        <p className="text-sm text-muted-foreground">
          Activation for an org is rollout ∩ manifest enabled ∩ plan
          entitlement. Missing rollout rows default to on. Common beta uses the
          shared list from Settings.
        </p>
      </div>
      <ExtensionRolloutPanel extensions={extensions} />
    </div>
  )
}

import { listRegisteredExtensions } from "@/lib/extensions"

export default function IntegrationsSettingsPage() {
  const extensions = listRegisteredExtensions()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-medium">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Registered extensions. Disabled extensions stay listed here but do not
          contribute nav or UI slots.
        </p>
      </div>

      <ul className="divide-y divide-border border">
        {extensions.map((extension) => (
          <li
            key={extension.id}
            className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {extension.displayName}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {extension.id}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>Plan: {extension.requiredPlan.join(", ")}</span>
              <span>{extension.enabled ? "Enabled" : "Disabled"}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

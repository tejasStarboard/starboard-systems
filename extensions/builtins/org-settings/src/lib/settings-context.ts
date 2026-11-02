/** Shape returned by `GET /api/settings/context` (plan + active integrations). */
export type SettingsContext = {
  plan: "credit" | "enterprise"
  integrations: ReadonlyArray<{
    extensionId: string
    displayName: string
    status: string
  }>
}

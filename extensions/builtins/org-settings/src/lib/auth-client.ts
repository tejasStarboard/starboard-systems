import { organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

/**
 * Better Auth browser client for `org.settings`. The package never imports the
 * kernel's `lib/auth-client`; same-origin cookies + the org plugin's default
 * roles are all settings pages need (company / team / profile / quote rules).
 */
export const authClient = createAuthClient({
  plugins: [organizationClient()],
})

export const { useSession } = authClient

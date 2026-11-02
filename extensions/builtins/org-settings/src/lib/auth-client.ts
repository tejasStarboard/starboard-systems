import { organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { ac, admin, member, owner } from "./permissions"

/**
 * Better Auth browser client for `org.settings`. The package never imports the
 * kernel's `lib/auth-client`; it mirrors the kernel's org plugin config
 * (`ac` + owner/admin/member roles) so team / invite flows match.
 */
export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles: { owner, admin, member },
    }),
  ],
})

export const { useSession } = authClient

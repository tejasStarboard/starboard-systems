import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

import { ac, admin, member, owner } from "@/lib/auth/permissions"

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
    }),
  ],
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
} = authClient

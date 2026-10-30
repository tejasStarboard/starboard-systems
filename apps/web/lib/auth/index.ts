import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import * as schema from "@starboard/db/schema"
import {
  OrganizationInvitationEmail,
  ResetPasswordEmail,
  VerifyEmail,
} from "@starboard/email/templates"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { organization } from "better-auth/plugins/organization"

import { env } from "@/env"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"

import { ac, admin, member, owner } from "./permissions"

export const auth = betterAuth({
  appName: "Starboard",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Starboard email",
        react: VerifyEmail({
          userName: user.name,
          url,
        }),
      })
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Starboard password",
        react: ResetPasswordEmail({
          userName: user.name,
          url,
        }),
      })
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    organization({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
      schema: {
        organization: {
          additionalFields: {
            plan: {
              type: "string",
              required: false,
              defaultValue: "credit",
              input: false,
            },
          },
        },
      },
      sendInvitationEmail: async (data) => {
        const inviteLink = `${env.APP_URL}/invitation?invitationId=${data.id}`
        await sendEmail({
          to: data.email,
          subject: `Join ${data.organization.name} on Starboard`,
          react: OrganizationInvitationEmail({
            inviterName: data.inviter.user.name,
            organizationName: data.organization.name,
            url: inviteLink,
          }),
        })
      },
    }),
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session

import "server-only"

import { cookies } from "next/headers"

import { env } from "@/env"

import {
  decodeImpersonationToken,
  encodeImpersonationToken,
  IMPERSONATION_MAX_AGE_SECONDS,
  type ImpersonationPayload,
} from "./impersonation-token"

export const IMPERSONATION_COOKIE = "sb_impersonate"

export type { ImpersonationPayload }

export async function readImpersonation(
  actorUserId: string
): Promise<ImpersonationPayload | null> {
  const jar = await cookies()
  return decodeImpersonationToken(
    jar.get(IMPERSONATION_COOKIE)?.value,
    actorUserId,
    env.BETTER_AUTH_SECRET
  )
}

export async function setImpersonationCookie(input: {
  organizationId: string
  actorUserId: string
}): Promise<void> {
  const jar = await cookies()
  jar.set(
    IMPERSONATION_COOKIE,
    encodeImpersonationToken(input, env.BETTER_AUTH_SECRET),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: env.APP_URL.startsWith("https"),
      path: "/",
      maxAge: IMPERSONATION_MAX_AGE_SECONDS,
    }
  )
}

export async function clearImpersonationCookie(): Promise<void> {
  const jar = await cookies()
  jar.delete(IMPERSONATION_COOKIE)
}

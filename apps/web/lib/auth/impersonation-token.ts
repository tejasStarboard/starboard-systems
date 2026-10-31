import { createHmac, timingSafeEqual } from "node:crypto"

export const IMPERSONATION_MAX_AGE_SECONDS = 60 * 60 * 8

export type ImpersonationPayload = {
  organizationId: string
  actorUserId: string
  exp: number
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url")
}

export function encodeImpersonationToken(
  payload: Omit<ImpersonationPayload, "exp">,
  secret: string,
  nowMs = Date.now()
): string {
  const full: ImpersonationPayload = {
    ...payload,
    exp: Math.floor(nowMs / 1000) + IMPERSONATION_MAX_AGE_SECONDS,
  }
  const payloadB64 = Buffer.from(JSON.stringify(full), "utf8").toString(
    "base64url"
  )
  return `${payloadB64}.${sign(payloadB64, secret)}`
}

export function decodeImpersonationToken(
  value: string | undefined,
  expectedActorUserId: string,
  secret: string,
  nowMs = Date.now()
): ImpersonationPayload | null {
  if (!value) {
    return null
  }
  const [payloadB64, signature] = value.split(".")
  if (!payloadB64 || !signature) {
    return null
  }
  const expected = sign(payloadB64, secret)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as ImpersonationPayload
    if (
      typeof parsed.organizationId !== "string" ||
      typeof parsed.actorUserId !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null
    }
    if (parsed.actorUserId !== expectedActorUserId) {
      return null
    }
    if (parsed.exp * 1000 < nowMs) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/** Decode messaging OAuth `state` (base64url of `organizationId:nonce`). */
export function decodeMessagingOAuthState(state: string): string | null {
  try {
    const padded = state + "=".repeat((4 - (state.length % 4)) % 4)
    const decoded = Buffer.from(padded, "base64url").toString("utf8")
    const organizationId = decoded.split(":")[0]?.trim()
    return organizationId || null
  } catch {
    return null
  }
}

export function isStaffUserIdInAllowlist(
  userId: string,
  allowlist: Iterable<string>
): boolean {
  const set = allowlist instanceof Set ? allowlist : new Set(allowlist)
  return set.has(userId)
}

export function parseStaffUserIds(raw: string | undefined): Set<string> {
  if (!raw) {
    return new Set()
  }
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  )
}

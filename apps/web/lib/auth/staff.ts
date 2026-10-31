import "server-only"

import { env } from "@/env"

import { isStaffUserIdInAllowlist, parseStaffUserIds } from "./staff-allowlist"

export { isStaffUserIdInAllowlist }

export function getStaffUserIds(): Set<string> {
  return parseStaffUserIds(env.PLATFORM_STAFF_USER_IDS)
}

export function isStaffUserId(userId: string): boolean {
  return isStaffUserIdInAllowlist(userId, getStaffUserIds())
}

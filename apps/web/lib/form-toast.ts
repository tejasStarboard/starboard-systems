import type { FieldErrors, FieldValues } from "react-hook-form"

import { toast } from "@starboard/lib-ui/components/toast"

function firstErrorMessage(errors: FieldErrors<FieldValues>): string | null {
  for (const value of Object.values(errors)) {
    if (!value) continue
    if (typeof value === "object" && "message" in value && value.message) {
      return String(value.message)
    }
    if (typeof value === "object") {
      const nested = firstErrorMessage(value as FieldErrors<FieldValues>)
      if (nested) return nested
    }
  }
  return null
}

/** Toast the first RHF validation error (submit / other events). */
export function toastFormErrors(errors: FieldErrors<FieldValues>) {
  toast.add({
    type: "error",
    title: "Check the form",
    description: firstErrorMessage(errors) ?? "Fix the highlighted fields.",
  })
}

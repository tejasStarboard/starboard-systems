import { toast } from "@starboard/lib-ui/components/toast"
import type { FieldErrors, FieldValues } from "react-hook-form"

export function toastFormErrors<T extends FieldValues>(errors: FieldErrors<T>) {
  const first = Object.values(errors)[0]
  const message =
    first && typeof first === "object" && "message" in first
      ? String(first.message)
      : "Check the form and try again."
  toast.add({
    type: "error",
    title: "Unable to save",
    description: message,
  })
}

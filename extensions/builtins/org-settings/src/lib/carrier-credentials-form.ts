export type CarrierValidationStatus = "ok" | "error" | null

export function carrierValidationMessage(input: {
  validating: boolean
  status: CarrierValidationStatus
  errorMessage: string | null
}): string {
  if (input.validating) {
    return "Validating…"
  }
  if (input.status === "ok") {
    return "Credentials validated"
  }
  if (input.status === "error") {
    const message = input.errorMessage?.trim()
    return message ? message : "Validation failed"
  }
  return "Not validated"
}

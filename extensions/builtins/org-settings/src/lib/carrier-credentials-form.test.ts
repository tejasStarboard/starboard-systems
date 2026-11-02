import { describe, expect, test } from "bun:test"

import { carrierValidationMessage } from "./carrier-credentials-form"

describe("carrierValidationMessage", () => {
  test("shows the in-flight state ahead of a previous result", () => {
    expect(
      carrierValidationMessage({
        validating: true,
        status: "ok",
        errorMessage: null,
      })
    ).toBe("Validating…")
  })

  test("shows validated, failure, and the empty state", () => {
    expect(
      carrierValidationMessage({
        validating: false,
        status: "ok",
        errorMessage: null,
      })
    ).toBe("Credentials validated")
    expect(
      carrierValidationMessage({
        validating: false,
        status: "error",
        errorMessage: "Carrier validation is unavailable",
      })
    ).toBe("Carrier validation is unavailable")
    expect(
      carrierValidationMessage({
        validating: false,
        status: null,
        errorMessage: null,
      })
    ).toBe("Not validated")
  })
})

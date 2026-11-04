export type E2eCredentials = {
  email: string
  password: string
  name: string
  orgName: string
  orgSlug: string
  customerName: string
}

/** Stable local/CI fixtures. Override via E2E_* env vars. */
export function e2eCredentials(): E2eCredentials {
  return {
    email: process.env.E2E_USER_EMAIL ?? "e2e@starboard.test",
    password: process.env.E2E_USER_PASSWORD ?? "E2eTestPass123!",
    name: process.env.E2E_USER_NAME ?? "E2E Tester",
    orgName: process.env.E2E_ORG_NAME ?? "E2E Org",
    orgSlug: process.env.E2E_ORG_SLUG ?? "e2e-org",
    customerName: process.env.E2E_CUSTOMER_NAME ?? "E2E Customer Co",
  }
}

export type E2eFixtures = {
  userId: string
  organizationId: string
  email: string
  orgSlug: string
  customerId?: string
  quoteId?: string
}

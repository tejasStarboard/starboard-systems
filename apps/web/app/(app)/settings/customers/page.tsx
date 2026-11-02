import { redirect } from "next/navigation"

/** Permanent redirect: customers live under `/customers` (crm.parties), not settings. */
export default function CustomersSettingsRedirectPage() {
  redirect("/customers")
}

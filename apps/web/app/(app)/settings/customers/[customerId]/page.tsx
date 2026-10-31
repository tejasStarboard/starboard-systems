import { redirect } from "next/navigation"

export default async function CustomerSettingsRedirectPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  const { customerId } = await params
  redirect(`/customers/${customerId}`)
}

import { notFound } from "next/navigation"

import { CustomerDetail } from "@/components/crm/customer-detail"
import { requireOrganizationContext } from "@/lib/auth/organization-context"
import { ServiceClientError } from "@/lib/clients/http"
import { getCrmManager } from "@/lib/domain/crm/crm.manager"

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  const { organizationId } = await requireOrganizationContext()
  const { customerId } = await params
  const crm = getCrmManager()

  try {
    const [customer, contacts] = await Promise.all([
      crm.getCustomer(organizationId, customerId),
      crm.listContacts(organizationId, customerId),
    ])
    return (
      <CustomerDetail initialCustomer={customer} initialContacts={contacts} />
    )
  } catch (error) {
    if (error instanceof ServiceClientError && error.status === 404) {
      notFound()
    }
    throw error
  }
}

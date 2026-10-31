import { CustomersList } from "@/components/crm/customers-list"
import { requireOrganizationContext } from "@/lib/auth/organization-context"
import { getCrmManager } from "@/lib/domain/crm/crm.manager"

export default async function CustomersPage() {
  const { organizationId } = await requireOrganizationContext()
  const initial = await getCrmManager().listCustomerRecords(organizationId, {
    page: 1,
    pageSize: 25,
  })

  return <CustomersList initial={initial} />
}

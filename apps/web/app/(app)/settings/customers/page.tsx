import { CustomersList } from "@/components/crm/customers-list"
import { requireOrganizationContext } from "@/lib/auth/organization-context"
import { getCrmManager } from "@/lib/domain/crm/crm.manager"

export default async function CustomersSettingsPage() {
  const { organizationId } = await requireOrganizationContext()
  const customers = await getCrmManager().listCustomerRecords(organizationId)

  return <CustomersList initialCustomers={customers} />
}

import { CustomersList } from "@/components/crm/customers-list"
import { CustomerSplitPanes } from "@/components/crm/customer-split-panes"
import { requireOrganizationContext } from "@/lib/auth/organization-context"
import { getCrmManager } from "@/lib/domain/crm/crm.manager"

export default async function CustomerSplitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { organizationId } = await requireOrganizationContext()
  const customers = await getCrmManager().listCustomerRecords(organizationId)

  return (
    <CustomerSplitPanes
      list={<CustomersList initialCustomers={customers} variant="pane" />}
      detail={children}
    />
  )
}

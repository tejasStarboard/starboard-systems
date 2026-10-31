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
  const initial = await getCrmManager().listCustomerRecords(organizationId, {
    page: 1,
    pageSize: 25,
  })

  return (
    <CustomerSplitPanes
      list={<CustomersList initial={initial} variant="pane" />}
      detail={children}
    />
  )
}

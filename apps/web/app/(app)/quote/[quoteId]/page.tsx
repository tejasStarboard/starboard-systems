import { QuoteForm } from "@/components/quotes/quote-form"
import { requireOrganizationContext } from "@/lib/auth/organization-context"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { getQuotesManager } from "@/lib/domain/quotes/quotes.manager"
import { emptyQuoteFormValues } from "@/lib/domain/quotes/quotes.schema"
import { listActiveSpotRateSources } from "@/lib/extensions"

export default async function QuotePage({
  params,
}: {
  params: Promise<{ quoteId: string }>
}) {
  const { quoteId } = await params
  const { organizationId } = await requireOrganizationContext()

  const quotesManager = getQuotesManager()
  const [savedQuote, options, plan] = await Promise.all([
    quotesManager.getQuoteFormValuesForOrg(quoteId, organizationId),
    quotesManager.loadQuoteFormOptions(organizationId),
    getOrganizationPlan(organizationId),
  ])
  const spotRateSources = await listActiveSpotRateSources(plan, organizationId)

  const {
    customerOptions,
    currencyOptions,
    portOptions,
    containerTypeOptions,
    palletTypeOptions,
  } = options

  const currencies = [...currencyOptions]
  const ports = [...portOptions]

  const defaultValues =
    savedQuote ??
    emptyQuoteFormValues({
      id: quoteId,
    })

  if (
    defaultValues.currencyCode &&
    !currencies.some((option) => option.value === defaultValues.currencyCode)
  ) {
    currencies.unshift({
      value: defaultValues.currencyCode,
      label: defaultValues.currencyCode,
    })
  }

  for (const lane of defaultValues.lanes) {
    for (const code of [
      lane.origin,
      lane.destination,
      lane.originVia,
      lane.destinationVia,
    ]) {
      const trimmed = code.trim()
      if (trimmed && !ports.some((option) => option.value === trimmed)) {
        ports.push({ value: trimmed, label: trimmed })
      }
    }
  }

  const firstLane = defaultValues.lanes[0]
  const firstContainer = firstLane?.containers[0]
  const defaultContainerType = containerTypeOptions[0]?.value
  if (
    firstLane?.mode === "fcl" &&
    firstContainer &&
    !firstContainer.containerType &&
    defaultContainerType
  ) {
    firstContainer.containerType = defaultContainerType
  }

  return (
    <div className="flex flex-1 flex-col p-3 sm:p-4">
      <QuoteForm
        defaultValues={defaultValues}
        customerOptions={customerOptions}
        currencyOptions={currencies}
        portOptions={ports}
        containerTypeOptions={containerTypeOptions}
        palletTypeOptions={palletTypeOptions}
        spotRateSources={spotRateSources}
      />
    </div>
  )
}

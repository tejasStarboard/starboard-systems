import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { QuoteForm } from "@/components/quotes/quote-form"
import { auth } from "@/lib/auth"
import {
  getQuoteFormValuesForOrg,
  loadQuoteFormOptions,
} from "@/lib/quotes/orchestrator"
import { emptyQuoteFormValues } from "@/lib/quotes/schema"

export default async function QuotePage({
  params,
}: {
  params: Promise<{ quoteId: string }>
}) {
  const { quoteId } = await params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const organizationId = session?.session.activeOrganizationId
  if (!organizationId) {
    redirect("/select-org")
  }

  const [savedQuote, options] = await Promise.all([
    getQuoteFormValuesForOrg(quoteId, organizationId),
    loadQuoteFormOptions(organizationId),
  ])

  const {
    customerOptions,
    currencyOptions,
    containerTypeOptions,
    palletTypeOptions,
  } = options

  if (!savedQuote && customerOptions.length === 0) {
    notFound()
  }

  const currencies = [...currencyOptions]

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
        containerTypeOptions={containerTypeOptions}
        palletTypeOptions={palletTypeOptions}
      />
    </div>
  )
}

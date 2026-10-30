import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { QuoteForm } from "@/components/quotes/quote-form"
import { auth } from "@/lib/auth"
import {
  getQuoteFormValues,
  listContainerTypeOptions,
  listCurrencyOptions,
  listCustomerOptions,
  listPalletTypeOptions,
} from "@/lib/quotes/queries"
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

  if (!session?.session.activeOrganizationId) {
    redirect("/select-org")
  }

  const [
    savedQuote,
    customerOptions,
    currencyOptions,
    containerTypeOptions,
    palletTypeOptions,
  ] = await Promise.all([
    getQuoteFormValues(quoteId),
    listCustomerOptions(),
    listCurrencyOptions(),
    listContainerTypeOptions(),
    listPalletTypeOptions(),
  ])

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

  const firstContainer = defaultValues.lane.containers[0]
  const defaultContainerType = containerTypeOptions[0]?.value
  if (
    defaultValues.lane.mode === "fcl" &&
    firstContainer &&
    !firstContainer.containerType &&
    defaultContainerType
  ) {
    firstContainer.containerType = defaultContainerType
  }

  return (
    <div className="flex flex-1 flex-col p-4">
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

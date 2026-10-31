"use client"

import {
  CaretLeftIcon,
  CaretRightIcon,
  PlugsIcon,
  PlusIcon,
} from "@phosphor-icons/react"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import type {
  ContactRecord,
  CustomerListItem,
  CustomerRecord,
  ListCustomerRecordsResponse,
} from "@starboard/lib-contracts"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@starboard/lib-ui/components/dialog"
import { toast } from "@starboard/lib-ui/components/toast"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { cn } from "@starboard/lib-ui/lib/utils"

import {
  createCustomerFormSchema,
  type CreateCustomerFormValues,
} from "@/lib/domain/crm/crm-forms.schema"
import { toastFormErrors } from "@/lib/form-toast"

const CUSTOMERS_PAGE_SIZE = 25

type SearchHit =
  | {
      kind: "customer"
      key: string
      customer: CustomerListItem
    }
  | {
      kind: "contact"
      key: string
      customer: CustomerListItem
      contact: ContactRecord
    }

function matchesText(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query)
}

function buildSearchHits(
  customers: CustomerListItem[],
  query: string
): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return customers.map((customer) => ({
      kind: "customer" as const,
      key: `customer:${customer.id}`,
      customer,
    }))
  }

  const hits: SearchHit[] = []
  for (const customer of customers) {
    const customerMatch =
      matchesText(customer.name, q) ||
      matchesText(customer.email, q) ||
      matchesText(customer.phone, q) ||
      matchesText(customer.address, q) ||
      matchesText(customer.city, q) ||
      matchesText(customer.state, q) ||
      matchesText(customer.countryCode, q) ||
      matchesText(customer.zip, q)

    if (customerMatch) {
      hits.push({
        kind: "customer",
        key: `customer:${customer.id}`,
        customer,
      })
    }

    for (const contact of customer.contacts ?? []) {
      const contactMatch =
        matchesText(contact.name, q) ||
        matchesText(contact.email, q) ||
        matchesText(contact.phone, q) ||
        matchesText(contact.role, q)
      if (!contactMatch) continue
      hits.push({
        kind: "contact",
        key: `contact:${contact.id}`,
        customer,
        contact,
      })
    }
  }
  return hits
}

function totalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function CustomersList({
  initial,
  variant = "page",
}: {
  initial: ListCustomerRecordsResponse
  variant?: "page" | "pane"
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [customers, setCustomers] = useState(initial.customers)
  const [pageSize] = useState(initial.pageSize || CUSTOMERS_PAGE_SIZE)
  const [total, setTotal] = useState(initial.total)
  const [loading, setLoading] = useState(false)
  const [listQuery, setListQuery] = useState({
    page: initial.page,
    q: "",
  })
  const skipFetchRef = useRef(true)

  const createForm = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerFormSchema),
    defaultValues: { name: "" },
  })

  useEffect(() => {
    setCustomers(initial.customers)
    setTotal(initial.total)
    setListQuery({ page: initial.page, q: "" })
  }, [initial])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQ = query.trim()
      setListQuery((prev) => (prev.q === nextQ ? prev : { page: 1, q: nextQ }))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          detail: "1",
          page: String(listQuery.page),
          pageSize: String(pageSize),
        })
        if (listQuery.q) params.set("q", listQuery.q)
        const response = await fetch(`/api/customers?${params}`)
        const body = (await response.json().catch(() => null)) as
          (ListCustomerRecordsResponse & { error?: string }) | null
        if (!response.ok || !body?.customers) {
          if (!cancelled) {
            toast.add({
              type: "error",
              title: "Unable to load customers",
              description: body?.error ?? "Something went wrong. Try again.",
            })
          }
          return
        }
        if (!cancelled) {
          setCustomers(body.customers)
          setTotal(body.total)
        }
      } catch {
        if (!cancelled) {
          toast.add({
            type: "error",
            title: "Unable to load customers",
            description: "Something went wrong. Try again.",
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [listQuery, pageSize])

  const hits = useMemo(
    () => buildSearchHits(customers, listQuery.q),
    [customers, listQuery.q]
  )
  const pages = totalPages(total, pageSize)

  async function onCreateCustomer(values: CreateCustomerFormValues) {
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name }),
      })
      const body = (await response.json().catch(() => null)) as
        (CustomerRecord & { error?: string }) | null
      if (!response.ok || !body?.id) {
        toast.add({
          type: "error",
          title: "Unable to create customer",
          description: body?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      createForm.reset({ name: "" })
      setDialogOpen(false)
      router.push(`/customers/${body.id}`)
      router.refresh()
    } catch {
      toast.add({
        type: "error",
        title: "Unable to create customer",
        description: "Something went wrong. Try again.",
      })
    }
  }

  const createDialog = (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) createForm.reset({ name: "" })
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            size="icon-sm"
            variant={"outline"}
            aria-label="Add customer"
          />
        }
      >
        <PlusIcon className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form
          onSubmit={createForm.handleSubmit(onCreateCustomer, toastFormErrors)}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>New customer</DialogTitle>
            <DialogDescription>
              Create a customer with a company name
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Controller
              control={createForm.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={`new-customer-name-${variant}`}>
                    Name
                  </FieldLabel>
                  <Input
                    id={`new-customer-name-${variant}`}
                    placeholder="Company name"
                    autoFocus
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createForm.formState.isSubmitting}>
              {createForm.formState.isSubmitting ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )

  const pagination = (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 border-t",
        variant === "page" ? "px-4 py-3" : "px-1 py-2"
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading || listQuery.page <= 1}
        onClick={() =>
          setListQuery((prev) => ({
            ...prev,
            page: Math.max(1, prev.page - 1),
          }))
        }
        aria-label="Previous page"
      >
        <CaretLeftIcon className="size-4" />
        <span className="sr-only sm:not-sr-only">Prev</span>
      </Button>
      <span className="text-xs text-muted-foreground">
        {total === 0 ? "0" : listQuery.page} / {total === 0 ? 0 : pages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading || listQuery.page >= pages || total === 0}
        onClick={() =>
          setListQuery((prev) => ({ ...prev, page: prev.page + 1 }))
        }
        aria-label="Next page"
      >
        <span className="sr-only sm:not-sr-only">Next</span>
        <CaretRightIcon className="size-4" />
      </Button>
    </div>
  )

  const list = (
    <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
      {hits.length === 0 ? (
        <li
          className={cn(
            "text-sm text-muted-foreground",
            variant === "page" ? "px-4 py-6" : "px-3 py-4"
          )}
        >
          {loading ? "Loading…" : "No customers or contacts match."}
        </li>
      ) : (
        hits.map((hit) => {
          const href = `/customers/${hit.customer.id}`
          const selected = pathname === href
          if (hit.kind === "contact") {
            return (
              <li key={hit.key}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center justify-between gap-3 transition-colors hover:bg-muted/50",
                    variant === "page" ? "px-4 py-3" : "px-3 py-2.5",
                    selected && "bg-muted"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {hit.contact.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[
                        "Contact",
                        hit.customer.name,
                        hit.contact.email,
                        hit.contact.role,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            )
          }

          return (
            <li key={hit.key}>
              <Link
                href={href}
                className={cn(
                  "flex items-center justify-between gap-3 transition-colors hover:bg-muted/50",
                  variant === "page" ? "px-4 py-3" : "px-3 py-2.5",
                  selected && "bg-muted",
                  !hit.customer.isActive && "opacity-60"
                )}
              >
                <span className="w-full min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="block truncate text-sm font-medium">
                      {hit.customer.name}
                    </span>
                    {!hit.customer.isActive && <PlugsIcon className="size-4" />}
                  </div>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[
                      "Customer",
                      hit.customer.isVendor ? "Vendor" : null,
                      hit.customer.email,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          )
        })
      )}
    </ul>
  )

  if (variant === "pane") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 p-3">
        <div className="flex items-start justify-between gap-2 px-0.5">
          <div className="space-y-1">
            <h1 className="text-sm font-medium">Customers</h1>
            <p className="text-xs text-muted-foreground">
              Search customers or contacts
            </p>
          </div>
          {createDialog}
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search…"
          aria-label="Search customers and contacts"
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {list}
          {pagination}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Org-scoped accounts and contacts used on quotes.
          </p>
        </div>
        {createDialog}
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search customers or contacts…"
        aria-label="Search customers and contacts"
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
        {list}
        {pagination}
      </div>
    </div>
  )
}

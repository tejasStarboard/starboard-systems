"use client"

import { PlusIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import type {
  ContactRecord,
  CustomerListItem,
  CustomerRecord,
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
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { cn } from "@starboard/lib-ui/lib/utils"

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

export function CustomersList({
  initialCustomers,
  variant = "page",
}: {
  initialCustomers: CustomerListItem[]
  variant?: "page" | "pane"
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState(initialCustomers)

  useEffect(() => {
    setCustomers(initialCustomers)
  }, [initialCustomers])

  const hits = useMemo(
    () => buildSearchHits(customers, query),
    [customers, query]
  )

  function resetDialog() {
    setName("")
    setError(null)
  }

  async function createCustomer() {
    const trimmed = name.trim()
    if (!trimmed || creating) return
    setCreating(true)
    setError(null)
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })
      const body = (await response.json().catch(() => null)) as
        (CustomerRecord & { error?: string }) | null
      if (!response.ok || !body?.id) {
        setError(body?.error ?? "Failed to create customer")
        return
      }
      const created: CustomerListItem = { ...body, contacts: [] }
      setCustomers((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      )
      resetDialog()
      setDialogOpen(false)
      router.push(`/customers/${body.id}`)
      router.refresh()
    } catch {
      setError("Failed to create customer")
    } finally {
      setCreating(false)
    }
  }

  const createDialog = (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetDialog()
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            size="icon-sm"
            variant={variant === "pane" ? "outline" : "default"}
            aria-label="Add customer"
          />
        }
      >
        <PlusIcon className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
          <DialogDescription>
            Create a customer with a company name. You can add details next.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`new-customer-name-${variant}`}>
              Name
            </FieldLabel>
            <Input
              id={`new-customer-name-${variant}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Company name"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  void createCustomer()
                }
              }}
              autoFocus
            />
          </Field>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </FieldGroup>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={creating || !name.trim()}
            onClick={() => void createCustomer()}
          >
            {creating ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
          No customers or contacts match.
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
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {hit.customer.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[
                      hit.customer.isActive ? null : "Inactive",
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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg">
          {list}
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
        {list}
      </div>
    </div>
  )
}

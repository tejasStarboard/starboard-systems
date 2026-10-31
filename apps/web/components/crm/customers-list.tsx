"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"

import type { CustomerRecord } from "@starboard/lib-contracts"

export function CustomersList({
  initialCustomers,
}: {
  initialCustomers: CustomerRecord[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [name, setName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState(initialCustomers)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q) ||
        row.phone?.toLowerCase().includes(q)
    )
  }, [customers, query])

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
      setCustomers((prev) =>
        [...prev, body].sort((a, b) => a.name.localeCompare(b.name))
      )
      setName("")
      router.push(`/customers/${body.id}`)
      router.refresh()
    } catch {
      setError("Failed to create customer")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Org-scoped accounts and contacts used on quotes.
        </p>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name, email, or phone…"
        aria-label="Search customers"
      />

      <div className="rounded-xl border bg-card">
        <FieldGroup className="gap-3 border-b p-4">
          <Field>
            <FieldLabel htmlFor="new-customer-name">New customer</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="new-customer-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Company name"
              />
              <Button
                type="button"
                disabled={creating || !name.trim()}
                onClick={() => void createCustomer()}
              >
                {creating ? "Creating…" : "Create"}
              </Button>
            </div>
          </Field>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </FieldGroup>

        <ul className="divide-y">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">
              No customers match.
            </li>
          ) : (
            filtered.map((customer) => (
              <li key={customer.id}>
                <Link
                  href={`/customers/${customer.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {customer.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[
                        customer.isCustomer ? "Customer" : null,
                        customer.isVendor ? "Vendor" : null,
                        customer.email,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No contact details"}
                    </span>
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

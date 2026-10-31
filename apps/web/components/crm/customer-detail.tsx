"use client"

import Link from "next/link"
import { useState } from "react"

import type { ContactRecord, CustomerRecord } from "@starboard/lib-contracts"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"

export function CustomerDetail({
  initialCustomer,
  initialContacts,
}: {
  initialCustomer: CustomerRecord
  initialContacts: ContactRecord[]
}) {
  const [customer, setCustomer] = useState(initialCustomer)
  const [contacts, setContacts] = useState(initialContacts)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactRole, setContactRole] = useState("")
  const [addingContact, setAddingContact] = useState(false)

  async function saveCustomer() {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customer.name,
          email: customer.email ?? "",
          phone: customer.phone ?? "",
          address: customer.address ?? "",
          isCustomer: customer.isCustomer,
          isVendor: customer.isVendor,
        }),
      })
      const body = (await response.json().catch(() => null)) as
        (CustomerRecord & { error?: string }) | null
      if (!response.ok || !body?.id) {
        setError(body?.error ?? "Failed to save customer")
        return
      }
      setCustomer(body)
      setMessage("Customer saved")
    } catch {
      setError("Failed to save customer")
    } finally {
      setSaving(false)
    }
  }

  async function addContact() {
    if (!contactName.trim() || addingContact) return
    setAddingContact(true)
    setError(null)
    try {
      const response = await fetch(`/api/customers/${customer.id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          role: contactRole,
        }),
      })
      const body = (await response.json().catch(() => null)) as
        (ContactRecord & { error?: string }) | null
      if (!response.ok || !body?.id) {
        setError(body?.error ?? "Failed to add contact")
        return
      }
      setContacts((prev) =>
        [...prev, body].sort((a, b) => a.name.localeCompare(b.name))
      )
      setContactName("")
      setContactEmail("")
      setContactPhone("")
      setContactRole("")
    } catch {
      setError("Failed to add contact")
    } finally {
      setAddingContact(false)
    }
  }

  async function removeContact(contactId: string) {
    setError(null)
    const response = await fetch(
      `/api/customers/${customer.id}/contacts/${contactId}`,
      { method: "DELETE" }
    )
    if (!response.ok && response.status !== 204) {
      const body = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      setError(body?.error ?? "Failed to delete contact")
      return
    }
    setContacts((prev) => prev.filter((row) => row.id !== contactId))
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-8">
      <div className="space-y-1">
        <Link
          href="/customers"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Customers
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {customer.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Edit account fields and manage contacts.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-medium">Details</h2>
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="customer-name">Name</FieldLabel>
            <Input
              id="customer-name"
              value={customer.name}
              onChange={(event) =>
                setCustomer((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="customer-email">Email</FieldLabel>
            <Input
              id="customer-email"
              type="email"
              value={customer.email ?? ""}
              onChange={(event) =>
                setCustomer((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="customer-phone">Phone</FieldLabel>
            <Input
              id="customer-phone"
              value={customer.phone ?? ""}
              onChange={(event) =>
                setCustomer((prev) => ({ ...prev, phone: event.target.value }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="customer-address">Address</FieldLabel>
            <Input
              id="customer-address"
              value={customer.address ?? ""}
              onChange={(event) =>
                setCustomer((prev) => ({
                  ...prev,
                  address: event.target.value,
                }))
              }
            />
          </Field>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={customer.isCustomer}
                onChange={(event) =>
                  setCustomer((prev) => ({
                    ...prev,
                    isCustomer: event.target.checked,
                  }))
                }
              />
              Customer
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={customer.isVendor}
                onChange={(event) =>
                  setCustomer((prev) => ({
                    ...prev,
                    isVendor: event.target.checked,
                  }))
                }
              />
              Vendor
            </label>
          </div>
        </FieldGroup>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            disabled={saving}
            onClick={() => void saveCustomer()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
          {message ? (
            <p className="text-xs text-muted-foreground">{message}</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-medium">Contacts</h2>
        <ul className="divide-y rounded-lg border">
          {contacts.length === 0 ? (
            <li className="px-3 py-4 text-sm text-muted-foreground">
              No contacts yet.
            </li>
          ) : (
            contacts.map((contact) => (
              <li
                key={contact.id}
                className="flex items-start justify-between gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{contact.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[contact.role, contact.email, contact.phone]
                      .filter(Boolean)
                      .join(" · ") || "No details"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void removeContact(contact.id)}
                >
                  Remove
                </Button>
              </li>
            ))
          )}
        </ul>

        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="contact-name">Name</FieldLabel>
            <Input
              id="contact-name"
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="contact-email">Email</FieldLabel>
              <Input
                id="contact-email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
              <Input
                id="contact-phone"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-role">Role</FieldLabel>
              <Input
                id="contact-role"
                value={contactRole}
                onChange={(event) => setContactRole(event.target.value)}
              />
            </Field>
          </div>
          <Button
            type="button"
            disabled={addingContact || !contactName.trim()}
            onClick={() => void addContact()}
          >
            {addingContact ? "Adding…" : "Add contact"}
          </Button>
        </FieldGroup>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

"use client"

import { TrashIcon } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import {
  customerRecordSchema,
  type ContactRecord,
  type CustomerRecord,
} from "@starboard/lib-contracts"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@starboard/lib-ui/components/card"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@starboard/lib-ui/components/sheet"
import { Switch } from "@starboard/lib-ui/components/switch"
import { Textarea } from "@starboard/lib-ui/components/textarea"

function normalizeCustomer(row: CustomerRecord): CustomerRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    countryCode: row.countryCode ?? null,
    zip: row.zip ?? null,
    isCustomer: row.isCustomer === true,
    isVendor: row.isVendor === true,
    isActive: row.isActive === true,
  }
}

function SwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span className="min-w-0 space-y-0.5">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <Switch
        checked={checked === true}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="shrink-0"
      />
    </label>
  )
}

export function CustomerDetail({
  initialCustomer,
  initialContacts,
}: {
  initialCustomer: CustomerRecord
  initialContacts: ContactRecord[]
}) {
  const router = useRouter()
  const [customer, setCustomer] = useState(() =>
    normalizeCustomer(initialCustomer)
  )
  const [savedCustomer, setSavedCustomer] = useState(() =>
    normalizeCustomer(initialCustomer)
  )
  const [contacts, setContacts] = useState(initialContacts)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [contactsSheetOpen, setContactsSheetOpen] = useState(false)
  const [contactQuery, setContactQuery] = useState("")
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactRole, setContactRole] = useState("")
  const [addingContact, setAddingContact] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)

  useEffect(() => {
    const next = normalizeCustomer(initialCustomer)
    setCustomer(next)
    setSavedCustomer(next)
    setContacts(initialContacts)
    setError(null)
    setMessage(null)
  }, [initialCustomer, initialContacts])

  const isDirty = useMemo(
    () =>
      customer.name !== savedCustomer.name ||
      (customer.email ?? "") !== (savedCustomer.email ?? "") ||
      (customer.phone ?? "") !== (savedCustomer.phone ?? "") ||
      (customer.address ?? "") !== (savedCustomer.address ?? "") ||
      (customer.city ?? "") !== (savedCustomer.city ?? "") ||
      (customer.state ?? "") !== (savedCustomer.state ?? "") ||
      (customer.countryCode ?? "") !== (savedCustomer.countryCode ?? "") ||
      (customer.zip ?? "") !== (savedCustomer.zip ?? "") ||
      customer.isCustomer !== savedCustomer.isCustomer ||
      customer.isVendor !== savedCustomer.isVendor ||
      customer.isActive !== savedCustomer.isActive,
    [customer, savedCustomer]
  )

  const filteredContacts = useMemo(() => {
    const q = contactQuery.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(q) ||
        contact.email?.toLowerCase().includes(q) ||
        contact.phone?.toLowerCase().includes(q) ||
        contact.role?.toLowerCase().includes(q)
    )
  }, [contactQuery, contacts])

  function resetContactForm() {
    setContactName("")
    setContactEmail("")
    setContactPhone("")
    setContactRole("")
    setContactError(null)
  }

  function undoCustomerChanges() {
    setCustomer(savedCustomer)
    setError(null)
    setMessage(null)
  }

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
          city: customer.city ?? "",
          state: customer.state ?? "",
          countryCode: customer.countryCode ?? "",
          zip: customer.zip ?? "",
          isCustomer: customer.isCustomer,
          isVendor: customer.isVendor,
          isActive: customer.isActive,
        }),
      })
      const body = (await response.json().catch(() => null)) as
        (CustomerRecord & { error?: string }) | null
      if (!response.ok || !body) {
        setError(body?.error ?? "Failed to save customer")
        return
      }
      const parsed = customerRecordSchema.safeParse(body)
      if (!parsed.success) {
        setError("Failed to save customer: invalid response")
        return
      }
      const next = normalizeCustomer(parsed.data)
      setCustomer(next)
      setSavedCustomer(next)
      setMessage("Customer saved")
      router.refresh()
    } catch {
      setError("Failed to save customer")
    } finally {
      setSaving(false)
    }
  }

  async function addContact() {
    if (!contactName.trim() || addingContact) return
    setAddingContact(true)
    setContactError(null)
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
        setContactError(body?.error ?? "Failed to add contact")
        return
      }
      setContacts((prev) =>
        [...prev, body].sort((a, b) => a.name.localeCompare(b.name))
      )
      resetContactForm()
      setContactDialogOpen(false)
    } catch {
      setContactError("Failed to add contact")
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
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {customer.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Edit account fields and manage contacts.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setContactsSheetOpen(true)}
            >
              View contacts
              {contacts.length > 0 ? (
                <span className="text-muted-foreground">
                  ({contacts.length})
                </span>
              ) : null}
            </Button>
          </div>

          <section className="space-y-4">
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor="customer-name">Name</FieldLabel>
                <Input
                  id="customer-name"
                  value={customer.name}
                  onChange={(event) =>
                    setCustomer((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="customer-email">Email</FieldLabel>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customer.email ?? ""}
                    onChange={(event) =>
                      setCustomer((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="customer-phone">Phone</FieldLabel>
                  <Input
                    id="customer-phone"
                    value={customer.phone ?? ""}
                    onChange={(event) =>
                      setCustomer((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="customer-address">Address</FieldLabel>
                <Textarea
                  id="customer-address"
                  rows={3}
                  value={customer.address ?? ""}
                  onChange={(event) =>
                    setCustomer((prev) => ({
                      ...prev,
                      address: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="customer-city">City</FieldLabel>
                  <Input
                    id="customer-city"
                    value={customer.city ?? ""}
                    onChange={(event) =>
                      setCustomer((prev) => ({
                        ...prev,
                        city: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="customer-state">
                    State / province
                  </FieldLabel>
                  <Input
                    id="customer-state"
                    value={customer.state ?? ""}
                    onChange={(event) =>
                      setCustomer((prev) => ({
                        ...prev,
                        state: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="customer-zip">ZIP / postal</FieldLabel>
                  <Input
                    id="customer-zip"
                    value={customer.zip ?? ""}
                    onChange={(event) =>
                      setCustomer((prev) => ({
                        ...prev,
                        zip: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="customer-country">
                    Country code
                  </FieldLabel>
                  <Input
                    id="customer-country"
                    value={customer.countryCode ?? ""}
                    onChange={(event) =>
                      setCustomer((prev) => ({
                        ...prev,
                        countryCode: event.target.value,
                      }))
                    }
                    placeholder="US"
                  />
                </Field>
              </div>
              <div className="divide-y">
                <SwitchRow
                  title="Active"
                  description="Inactive accounts stay in CRM but are hidden from the quote picker."
                  checked={customer.isActive === true}
                  onCheckedChange={(checked) =>
                    setCustomer((prev) => ({ ...prev, isActive: checked }))
                  }
                />
                <SwitchRow
                  title="Customer"
                  description="Treat this account as a customer for quoting and sales."
                  checked={customer.isCustomer === true}
                  onCheckedChange={(checked) =>
                    setCustomer((prev) => ({ ...prev, isCustomer: checked }))
                  }
                />
                <SwitchRow
                  title="Vendor"
                  description="Mark this account as a vendor or carrier partner."
                  checked={customer.isVendor === true}
                  onCheckedChange={(checked) =>
                    setCustomer((prev) => ({ ...prev, isVendor: checked }))
                  }
                />
              </div>
            </FieldGroup>
          </section>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t bg-background px-5 py-4 lg:px-8">
        {message ? (
          <p className="mr-auto text-xs text-muted-foreground">{message}</p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={!isDirty || saving}
          onClick={undoCustomerChanges}
        >
          Undo
        </Button>
        <Button
          type="button"
          disabled={saving || !isDirty}
          onClick={() => void saveCustomer()}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <Sheet
        open={contactsSheetOpen}
        onOpenChange={(open) => {
          setContactsSheetOpen(open)
          if (!open) setContactQuery("")
        }}
      >
        <SheetContent
          side="right"
          className="flex h-full min-h-0 flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="shrink-0 gap-1 px-4 pt-4 pr-12 pb-3 text-left">
            <SheetTitle>Contacts</SheetTitle>
            <SheetDescription>
              People linked to{" "}
              <span className="font-semibold">{customer.name}</span>
            </SheetDescription>
          </SheetHeader>

          <div className="shrink-0 px-4 pb-3">
            <Input
              value={contactQuery}
              onChange={(event) => setContactQuery(event.target.value)}
              placeholder="Search contacts…"
              aria-label="Search contacts"
            />
          </div>

          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4">
            {filteredContacts.length === 0 ? (
              <li className="py-6 text-sm text-muted-foreground">
                {contacts.length === 0
                  ? "No contacts yet."
                  : "No contacts match."}
              </li>
            ) : (
              filteredContacts.map((contact) => (
                <li key={contact.id}>
                  <Card size="sm" className="group">
                    <CardHeader className="has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto]">
                      <CardTitle className="truncate">{contact.name}</CardTitle>
                      <CardDescription className="truncate">
                        {[contact.role, contact.email, contact.phone]
                          .filter(Boolean)
                          .join(" · ") || "No details"}
                      </CardDescription>
                      <CardAction>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                          aria-label={`Remove ${contact.name}`}
                          onClick={() => void removeContact(contact.id)}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </CardAction>
                    </CardHeader>
                  </Card>
                </li>
              ))
            )}
          </ul>

          <div className="shrink-0 border-t px-4 py-3">
            <Dialog
              open={contactDialogOpen}
              onOpenChange={(open) => {
                setContactDialogOpen(open)
                if (!open) resetContactForm()
              }}
            >
              <DialogTrigger
                render={<Button type="button" className="w-full" />}
              >
                Add contact
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add contact</DialogTitle>
                  <DialogDescription>
                    Add a person under{" "}
                    <span className="font-semibold">{customer.name}</span>
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup className="gap-3">
                  <Field>
                    <FieldLabel htmlFor="contact-name">Name</FieldLabel>
                    <Input
                      id="contact-name"
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="contact-email">Email</FieldLabel>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactEmail}
                        onChange={(event) =>
                          setContactEmail(event.target.value)
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
                      <Input
                        id="contact-phone"
                        value={contactPhone}
                        onChange={(event) =>
                          setContactPhone(event.target.value)
                        }
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="contact-role">Role</FieldLabel>
                    <Input
                      id="contact-role"
                      value={contactRole}
                      onChange={(event) => setContactRole(event.target.value)}
                    />
                  </Field>
                  {contactError ? (
                    <p className="text-xs text-destructive">{contactError}</p>
                  ) : null}
                </FieldGroup>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setContactDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={addingContact || !contactName.trim()}
                    onClick={() => void addContact()}
                  >
                    {addingContact ? "Adding…" : "Add contact"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

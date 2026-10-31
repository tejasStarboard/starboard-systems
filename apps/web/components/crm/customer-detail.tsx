"use client"

import { CaretLeftIcon, CaretRightIcon, TrashIcon } from "@phosphor-icons/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import {
  customerRecordSchema,
  type ContactRecord,
  type CustomerRecord,
  type ListContactsResponse,
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
  FieldError,
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
import { toast } from "@starboard/lib-ui/components/toast"

import {
  contactFormSchema,
  customerFormSchema,
  customerToFormValues,
  emptyContactFormValues,
  type ContactFormValues,
  type CustomerFormValues,
} from "@/lib/domain/crm/crm-forms.schema"
import { toastFormErrors } from "@/lib/form-toast"

const CONTACTS_PAGE_SIZE = 25

function totalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize))
}

function SwitchRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label
      className={`flex items-center justify-between gap-4 py-3 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <span className="min-w-0 space-y-0.5">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <Switch
        checked={checked === true}
        disabled={disabled}
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
  initialContacts: ListContactsResponse
}) {
  const router = useRouter()
  const [contacts, setContacts] = useState(initialContacts.contacts)
  const [contactsTotal, setContactsTotal] = useState(initialContacts.total)
  const [contactsPageSize] = useState(
    initialContacts.pageSize || CONTACTS_PAGE_SIZE
  )
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsSheetOpen, setContactsSheetOpen] = useState(false)
  const [contactQuery, setContactQuery] = useState("")
  const [contactsListQuery, setContactsListQuery] = useState({
    page: initialContacts.page,
    q: "",
  })
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [isActive, setIsActive] = useState(initialCustomer.isActive === true)
  const [togglingActive, setTogglingActive] = useState(false)
  const skipContactsFetchRef = useRef(true)

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customerToFormValues(initialCustomer),
  })

  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: emptyContactFormValues,
  })

  const customerName = form.watch("name")
  const formDisabled = !isActive || togglingActive
  const contactsPages = totalPages(contactsTotal, contactsPageSize)

  useEffect(() => {
    form.reset(customerToFormValues(initialCustomer))
    setIsActive(initialCustomer.isActive === true)
    setContacts(initialContacts.contacts)
    setContactsTotal(initialContacts.total)
    setContactsListQuery({ page: initialContacts.page, q: "" })
  }, [form, initialCustomer, initialContacts])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQ = contactQuery.trim()
      setContactsListQuery((prev) =>
        prev.q === nextQ ? prev : { page: 1, q: nextQ }
      )
    }, 300)
    return () => window.clearTimeout(timer)
  }, [contactQuery])

  useEffect(() => {
    if (skipContactsFetchRef.current) {
      skipContactsFetchRef.current = false
      return
    }

    let cancelled = false
    async function loadContacts() {
      setContactsLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(contactsListQuery.page),
          pageSize: String(contactsPageSize),
        })
        if (contactsListQuery.q) params.set("q", contactsListQuery.q)
        const response = await fetch(
          `/api/customers/${initialCustomer.id}/contacts?${params}`
        )
        const body = (await response.json().catch(() => null)) as
          | (ListContactsResponse & { error?: string })
          | null
        if (!response.ok || !body?.contacts) {
          if (!cancelled) {
            toast.add({
              type: "error",
              title: "Unable to load contacts",
              description: body?.error ?? "Something went wrong. Try again.",
            })
          }
          return
        }
        if (!cancelled) {
          setContacts(body.contacts)
          setContactsTotal(body.total)
        }
      } catch {
        if (!cancelled) {
          toast.add({
            type: "error",
            title: "Unable to load contacts",
            description: "Something went wrong. Try again.",
          })
        }
      } finally {
        if (!cancelled) setContactsLoading(false)
      }
    }

    void loadContacts()
    return () => {
      cancelled = true
    }
  }, [contactsListQuery, contactsPageSize, initialCustomer.id])

  async function toggleActive(nextActive: boolean) {
    if (togglingActive) return
    setTogglingActive(true)
    if (!nextActive && form.formState.isDirty) {
      form.reset()
    }
    try {
      const response = await fetch(`/api/customers/${initialCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      })
      const body = (await response.json().catch(() => null)) as
        | (CustomerRecord & { error?: string })
        | null
      if (!response.ok || !body) {
        toast.add({
          type: "error",
          title: "Unable to update status",
          description: body?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      const parsed = customerRecordSchema.safeParse(body)
      if (!parsed.success) {
        toast.add({
          type: "error",
          title: "Unable to update status",
          description: "Invalid response from server.",
        })
        return
      }
      setIsActive(parsed.data.isActive === true)
      form.reset(customerToFormValues(parsed.data))
      toast.add({
        type: "success",
        title: parsed.data.isActive ? "Customer activated" : "Customer deactivated",
      })
      router.refresh()
    } catch {
      toast.add({
        type: "error",
        title: "Unable to update status",
        description: "Something went wrong. Try again.",
      })
    } finally {
      setTogglingActive(false)
    }
  }

  async function onSaveCustomer(values: CustomerFormValues) {
    if (!isActive) return
    try {
      const response = await fetch(`/api/customers/${initialCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, isActive: true }),
      })
      const body = (await response.json().catch(() => null)) as
        | (CustomerRecord & { error?: string })
        | null
      if (!response.ok || !body) {
        toast.add({
          type: "error",
          title: "Unable to save customer",
          description: body?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      const parsed = customerRecordSchema.safeParse(body)
      if (!parsed.success) {
        toast.add({
          type: "error",
          title: "Unable to save customer",
          description: "Invalid response from server.",
        })
        return
      }
      setIsActive(parsed.data.isActive === true)
      form.reset(customerToFormValues(parsed.data))
      toast.add({ type: "success", title: "Customer saved" })
      router.refresh()
    } catch {
      toast.add({
        type: "error",
        title: "Unable to save customer",
        description: "Something went wrong. Try again.",
      })
    }
  }

  async function reloadContacts(
    page = contactsListQuery.page,
    q = contactsListQuery.q
  ) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(contactsPageSize),
    })
    if (q) params.set("q", q)
    const response = await fetch(
      `/api/customers/${initialCustomer.id}/contacts?${params}`
    )
    const body = (await response.json().catch(() => null)) as
      | (ListContactsResponse & { error?: string })
      | null
    if (!response.ok || !body?.contacts) {
      throw new Error(body?.error ?? "Unable to load contacts")
    }
    skipContactsFetchRef.current = true
    setContacts(body.contacts)
    setContactsTotal(body.total)
    setContactsListQuery({ page: body.page, q })
  }

  async function onAddContact(values: ContactFormValues) {
    try {
      const response = await fetch(
        `/api/customers/${initialCustomer.id}/contacts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      )
      const body = (await response.json().catch(() => null)) as
        (ContactRecord & { error?: string }) | null
      if (!response.ok || !body?.id) {
        toast.add({
          type: "error",
          title: "Unable to add contact",
          description: body?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      contactForm.reset(emptyContactFormValues)
      setContactDialogOpen(false)
      setContactQuery("")
      await reloadContacts(1, "")
      toast.add({ type: "success", title: "Contact added" })
    } catch {
      toast.add({
        type: "error",
        title: "Unable to add contact",
        description: "Something went wrong. Try again.",
      })
    }
  }

  async function removeContact(contactId: string) {
    const response = await fetch(
      `/api/customers/${initialCustomer.id}/contacts/${contactId}`,
      { method: "DELETE" }
    )
    if (!response.ok && response.status !== 204) {
      const body = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      toast.add({
        type: "error",
        title: "Unable to remove contact",
        description: body?.error ?? "Something went wrong. Try again.",
      })
      return
    }
    try {
      const nextPage =
        contacts.length <= 1 && contactsListQuery.page > 1
          ? contactsListQuery.page - 1
          : contactsListQuery.page
      await reloadContacts(nextPage)
    } catch {
      setContacts((prev) => prev.filter((row) => row.id !== contactId))
      setContactsTotal((prev) => Math.max(0, prev - 1))
    }
  }

  const { isDirty, isSubmitting } = form.formState
  const contactSubmitting = contactForm.formState.isSubmitting

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <form
        className="flex h-full min-h-0 w-full flex-col"
        onSubmit={form.handleSubmit(onSaveCustomer, toastFormErrors)}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 lg:px-8">
          <div className="flex flex-col gap-8">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {customerName || initialCustomer.name}
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
                {contactsTotal > 0 ? (
                  <span className="text-muted-foreground">
                    ({contactsTotal})
                  </span>
                ) : null}
              </Button>
            </div>

            <section className="space-y-4">
              <FieldGroup className="gap-3">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="customer-name">Name</FieldLabel>
                      <Input
                        id="customer-name"
                        {...field}
                        disabled={formDisabled}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor="customer-email">Email</FieldLabel>
                        <Input
                          id="customer-email"
                          type="email"
                          {...field}
                          disabled={formDisabled}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="phone"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor="customer-phone">Phone</FieldLabel>
                        <Input
                          id="customer-phone"
                          {...field}
                          disabled={formDisabled}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>
                <Controller
                  control={form.control}
                  name="address"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="customer-address">
                        Address
                      </FieldLabel>
                      <Textarea
                        id="customer-address"
                        rows={3}
                        {...field}
                        disabled={formDisabled}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="customer-city">City</FieldLabel>
                        <Input
                          id="customer-city"
                          {...field}
                          disabled={formDisabled}
                        />
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="customer-state">
                          State / province
                        </FieldLabel>
                        <Input
                          id="customer-state"
                          {...field}
                          disabled={formDisabled}
                        />
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="customer-zip">
                          ZIP / postal
                        </FieldLabel>
                        <Input
                          id="customer-zip"
                          {...field}
                          disabled={formDisabled}
                        />
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="customer-country">
                          Country code
                        </FieldLabel>
                        <Input
                          id="customer-country"
                          placeholder="US"
                          {...field}
                          disabled={formDisabled}
                        />
                      </Field>
                    )}
                  />
                </div>
                <div className="divide-y">
                  <Controller
                    control={form.control}
                    name="isCustomer"
                    render={({ field }) => (
                      <SwitchRow
                        title="Customer"
                        description="Treat this account as a customer for quoting and sales."
                        checked={field.value}
                        disabled={formDisabled}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="isVendor"
                    render={({ field }) => (
                      <SwitchRow
                        title="Vendor"
                        description="Mark this account as a vendor or carrier partner."
                        checked={field.value}
                        disabled={formDisabled}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </FieldGroup>
            </section>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t bg-background px-5 py-4 lg:px-8">
          <label className="mr-auto flex items-center gap-2">
            <Switch
              checked={isActive}
              disabled={togglingActive || isSubmitting}
              onCheckedChange={(value) => void toggleActive(value === true)}
              aria-label="Active"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={formDisabled || !isDirty || isSubmitting}
            onClick={() => form.reset()}
          >
            Undo
          </Button>
          <Button
            type="submit"
            disabled={formDisabled || isSubmitting || !isDirty}
          >
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>

      <Sheet
        open={contactsSheetOpen}
        onOpenChange={(open) => {
          setContactsSheetOpen(open)
          if (!open) {
            setContactQuery("")
            setContactsListQuery({ page: 1, q: "" })
          }
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
              <span className="font-semibold">
                {customerName || initialCustomer.name}
              </span>
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
            {contacts.length === 0 ? (
              <li className="py-6 text-sm text-muted-foreground">
                {contactsLoading
                  ? "Loading…"
                  : contactsTotal === 0 && !contactsListQuery.q
                    ? "No contacts yet."
                    : "No contacts match."}
              </li>
            ) : (
              contacts.map((contact) => (
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

          <div className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={contactsLoading || contactsListQuery.page <= 1}
              onClick={() =>
                setContactsListQuery((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
              aria-label="Previous contacts page"
            >
              <CaretLeftIcon className="size-4" />
              <span className="sr-only sm:not-sr-only">Prev</span>
            </Button>
            <span className="text-xs text-muted-foreground">
              {contactsTotal === 0 ? "0" : contactsListQuery.page} /{" "}
              {contactsTotal === 0 ? 0 : contactsPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                contactsLoading ||
                contactsListQuery.page >= contactsPages ||
                contactsTotal === 0
              }
              onClick={() =>
                setContactsListQuery((prev) => ({
                  ...prev,
                  page: prev.page + 1,
                }))
              }
              aria-label="Next contacts page"
            >
              <span className="sr-only sm:not-sr-only">Next</span>
              <CaretRightIcon className="size-4" />
            </Button>
          </div>

          <div className="shrink-0 border-t px-4 py-3">
            <Dialog
              open={contactDialogOpen}
              onOpenChange={(open) => {
                setContactDialogOpen(open)
                if (!open) contactForm.reset(emptyContactFormValues)
              }}
            >
              <DialogTrigger
                render={<Button type="button" className="w-full" />}
              >
                Add contact
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form
                  onSubmit={contactForm.handleSubmit(
                    onAddContact,
                    toastFormErrors
                  )}
                >
                  <DialogHeader>
                    <DialogTitle>Add contact</DialogTitle>
                    <DialogDescription>
                      Add a person under{" "}
                      <span className="font-semibold">
                        {customerName || initialCustomer.name}
                      </span>
                    </DialogDescription>
                  </DialogHeader>
                  <FieldGroup className="gap-3">
                    <Controller
                      control={contactForm.control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor="contact-name">Name</FieldLabel>
                          <Input
                            id="contact-name"
                            {...field}
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Controller
                        control={contactForm.control}
                        name="email"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel htmlFor="contact-email">
                              Email
                            </FieldLabel>
                            <Input
                              id="contact-email"
                              type="email"
                              {...field}
                              aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />
                      <Controller
                        control={contactForm.control}
                        name="phone"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel htmlFor="contact-phone">
                              Phone
                            </FieldLabel>
                            <Input id="contact-phone" {...field} />
                          </Field>
                        )}
                      />
                    </div>
                    <Controller
                      control={contactForm.control}
                      name="role"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor="contact-role">Role</FieldLabel>
                          <Input id="contact-role" {...field} />
                        </Field>
                      )}
                    />
                  </FieldGroup>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setContactDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={contactSubmitting}>
                      {contactSubmitting ? "Adding…" : "Add contact"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

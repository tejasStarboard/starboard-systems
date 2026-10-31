import { describe, expect, test } from "bun:test"
import type { FormOption } from "@starboard/lib-contracts"

import { DefaultCrmService } from "./crm.service"
import type {
  ContactInsert,
  ContactRow,
  ContactUpdate,
  CrmDao,
  CrmListParams,
  CrmListResult,
  CustomerInsert,
  CustomerNameRow,
  CustomerRow,
  CustomerUpdate,
} from "../dao/crm.dao"

function matchesText(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query)
}

class InMemoryCrmDao implements CrmDao {
  private customers: CustomerRow[] = []
  private contacts: ContactRow[] = []

  async listOptionsByOrganization(
    organizationId: string
  ): Promise<FormOption[]> {
    return this.customers
      .filter((row) => row.organizationId === organizationId && row.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((row) => ({ value: row.id, label: row.name }))
  }

  async listRecordsByOrganization(
    organizationId: string,
    params: CrmListParams
  ): Promise<CrmListResult<CustomerRow>> {
    const q = params.q?.trim().toLowerCase() ?? ""
    const filtered = this.customers
      .filter((row) => row.organizationId === organizationId)
      .filter((row) => {
        if (!q) return true
        const customerMatch =
          matchesText(row.name, q) ||
          matchesText(row.email, q) ||
          matchesText(row.phone, q) ||
          matchesText(row.address, q) ||
          matchesText(row.city, q) ||
          matchesText(row.state, q) ||
          matchesText(row.countryCode, q) ||
          matchesText(row.zip, q)
        if (customerMatch) return true
        return this.contacts.some(
          (contact) =>
            contact.organizationId === organizationId &&
            contact.customerId === row.id &&
            (matchesText(contact.name, q) ||
              matchesText(contact.email, q) ||
              matchesText(contact.phone, q) ||
              matchesText(contact.role, q))
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      rows: filtered.slice(params.offset, params.offset + params.limit),
      total: filtered.length,
    }
  }

  async getById(
    organizationId: string,
    customerId: string
  ): Promise<CustomerRow | null> {
    return (
      this.customers.find(
        (row) => row.organizationId === organizationId && row.id === customerId
      ) ?? null
    )
  }

  async insert(row: CustomerInsert): Promise<CustomerRow> {
    const created: CustomerRow = { ...row }
    this.customers.push(created)
    return created
  }

  async update(
    organizationId: string,
    customerId: string,
    patch: CustomerUpdate
  ): Promise<CustomerRow | null> {
    const index = this.customers.findIndex(
      (row) => row.organizationId === organizationId && row.id === customerId
    )
    if (index < 0) return null
    const current = this.customers[index]!
    const updated = { ...current, ...patch }
    this.customers[index] = updated
    return updated
  }

  async getNamesByIds(
    organizationId: string,
    ids: string[]
  ): Promise<CustomerNameRow[]> {
    const idSet = new Set(ids)
    return this.customers
      .filter(
        (row) => row.organizationId === organizationId && idSet.has(row.id)
      )
      .map((row) => ({ id: row.id, name: row.name }))
  }

  async listContacts(
    organizationId: string,
    customerId: string,
    params: CrmListParams
  ): Promise<CrmListResult<ContactRow>> {
    const q = params.q?.trim().toLowerCase() ?? ""
    const filtered = this.contacts
      .filter(
        (row) =>
          row.organizationId === organizationId && row.customerId === customerId
      )
      .filter(
        (row) =>
          !q ||
          matchesText(row.name, q) ||
          matchesText(row.email, q) ||
          matchesText(row.phone, q) ||
          matchesText(row.role, q)
      )
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      rows: filtered.slice(params.offset, params.offset + params.limit),
      total: filtered.length,
    }
  }

  async listContactsByCustomerIds(
    organizationId: string,
    customerIds: string[]
  ): Promise<ContactRow[]> {
    const idSet = new Set(customerIds)
    return this.contacts
      .filter(
        (row) =>
          row.organizationId === organizationId && idSet.has(row.customerId)
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async getContactById(
    organizationId: string,
    customerId: string,
    contactId: string
  ): Promise<ContactRow | null> {
    return (
      this.contacts.find(
        (row) =>
          row.organizationId === organizationId &&
          row.customerId === customerId &&
          row.id === contactId
      ) ?? null
    )
  }

  async insertContact(row: ContactInsert): Promise<ContactRow> {
    const created: ContactRow = { ...row }
    this.contacts.push(created)
    return created
  }

  async updateContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    patch: ContactUpdate
  ): Promise<ContactRow | null> {
    const index = this.contacts.findIndex(
      (row) =>
        row.organizationId === organizationId &&
        row.customerId === customerId &&
        row.id === contactId
    )
    if (index < 0) return null
    const current = this.contacts[index]!
    const updated = { ...current, ...patch }
    this.contacts[index] = updated
    return updated
  }

  async deleteContact(
    organizationId: string,
    customerId: string,
    contactId: string
  ): Promise<boolean> {
    const before = this.contacts.length
    this.contacts = this.contacts.filter(
      (row) =>
        !(
          row.organizationId === organizationId &&
          row.customerId === customerId &&
          row.id === contactId
        )
    )
    return this.contacts.length < before
  }
}

describe("DefaultCrmService org isolation", () => {
  test("org A cannot list or resolve org B customers", async () => {
    const dao = new InMemoryCrmDao()
    const service = new DefaultCrmService(dao)

    const orgA = await service.create("org-a", { name: "Acme" })
    const orgB = await service.create("org-b", { name: "Beta Co" })

    const listA = await service.list("org-a")
    expect(listA).toEqual([{ value: orgA.id, label: "Acme" }])
    expect(listA.some((row) => row.value === orgB.id)).toBe(false)

    const listB = await service.list("org-b")
    expect(listB).toEqual([{ value: orgB.id, label: "Beta Co" }])
    expect(listB.some((row) => row.value === orgA.id)).toBe(false)

    const namesForA = await service.getNamesByIds("org-a", [orgA.id, orgB.id])
    expect(namesForA).toEqual([{ id: orgA.id, name: "Acme" }])
    expect(namesForA.some((row) => row.id === orgB.id)).toBe(false)

    const namesForB = await service.getNamesByIds("org-b", [orgA.id, orgB.id])
    expect(namesForB).toEqual([{ id: orgB.id, name: "Beta Co" }])
  })

  test("rejects empty organizationId and empty name", async () => {
    const service = new DefaultCrmService(new InMemoryCrmDao())

    await expect(service.list("")).rejects.toThrow("organizationId is required")
    await expect(service.create("org-a", { name: "  " })).rejects.toThrow(
      "Customer name is required"
    )
  })

  test("updates expanded fields and keeps quote picker label as name", async () => {
    const service = new DefaultCrmService(new InMemoryCrmDao())
    const created = await service.create("org-a", {
      name: "Acme",
      email: "ops@acme.test",
      phone: "+1-555-0100",
      address: "1 Harbor Way",
      city: "Oakland",
      state: "CA",
      countryCode: "US",
      zip: "94607",
      isVendor: true,
    })

    expect(created.email).toBe("ops@acme.test")
    expect(created.city).toBe("Oakland")
    expect(created.state).toBe("CA")
    expect(created.countryCode).toBe("US")
    expect(created.zip).toBe("94607")
    expect(created.isCustomer).toBe(true)
    expect(created.isVendor).toBe(true)
    expect(created.isActive).toBe(true)

    const updated = await service.update("org-a", created.id, {
      phone: "+1-555-0199",
      city: "San Francisco",
      isVendor: false,
    })
    expect(updated.phone).toBe("+1-555-0199")
    expect(updated.city).toBe("San Francisco")
    expect(updated.isVendor).toBe(false)

    const options = await service.list("org-a")
    expect(options).toEqual([{ value: created.id, label: "Acme" }])
  })

  test("inactive customers stay in records but leave quote picker options", async () => {
    const service = new DefaultCrmService(new InMemoryCrmDao())
    const created = await service.create("org-a", { name: "Acme" })

    await service.update("org-a", created.id, { isActive: false })

    expect(await service.list("org-a")).toEqual([])
    expect(await service.listRecords("org-a")).toEqual({
      customers: [
        expect.objectContaining({
          id: created.id,
          name: "Acme",
          isActive: false,
        }),
      ],
      page: 1,
      pageSize: 25,
      total: 1,
    })
  })

  test("paginates customer and contact lists", async () => {
    const service = new DefaultCrmService(new InMemoryCrmDao())
    const first = await service.create("org-a", { name: "Alpha" })
    await service.create("org-a", { name: "Beta" })
    await service.create("org-a", { name: "Charlie" })

    const page1 = await service.listRecords("org-a", { page: 1, pageSize: 2 })
    expect(page1.customers.map((row) => row.name)).toEqual(["Alpha", "Beta"])
    expect(page1.total).toBe(3)
    expect(page1.page).toBe(1)
    expect(page1.pageSize).toBe(2)

    const page2 = await service.listRecords("org-a", { page: 2, pageSize: 2 })
    expect(page2.customers.map((row) => row.name)).toEqual(["Charlie"])

    await service.createContact("org-a", first.id, { name: "Ann" })
    await service.createContact("org-a", first.id, { name: "Bob" })
    await service.createContact("org-a", first.id, { name: "Cara" })

    const contactsPage = await service.listContacts("org-a", first.id, {
      page: 1,
      pageSize: 2,
    })
    expect(contactsPage.contacts.map((row) => row.name)).toEqual(["Ann", "Bob"])
    expect(contactsPage.total).toBe(3)
  })

  test("contacts CRUD is org and customer scoped", async () => {
    const service = new DefaultCrmService(new InMemoryCrmDao())
    const customerA = await service.create("org-a", { name: "Acme" })
    const customerB = await service.create("org-b", { name: "Beta" })

    const contact = await service.createContact("org-a", customerA.id, {
      name: "Pat Ops",
      email: "pat@acme.test",
      role: "Buyer",
    })

    await expect(service.listContacts("org-b", customerA.id)).rejects.toThrow(
      "Customer not found"
    )

    await expect(
      service.createContact("org-a", customerB.id, { name: "Nope" })
    ).rejects.toThrow("Customer not found")

    const listed = await service.listContacts("org-a", customerA.id)
    expect(listed).toEqual({
      contacts: [
        {
          id: contact.id,
          customerId: customerA.id,
          name: "Pat Ops",
          email: "pat@acme.test",
          phone: null,
          role: "Buyer",
        },
      ],
      page: 1,
      pageSize: 25,
      total: 1,
    })

    const updated = await service.updateContact(
      "org-a",
      customerA.id,
      contact.id,
      { phone: "555" }
    )
    expect(updated.phone).toBe("555")

    await service.deleteContact("org-a", customerA.id, contact.id)
    expect(await service.listContacts("org-a", customerA.id)).toEqual({
      contacts: [],
      page: 1,
      pageSize: 25,
      total: 0,
    })
  })
})

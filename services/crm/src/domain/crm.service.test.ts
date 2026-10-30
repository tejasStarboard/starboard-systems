import { describe, expect, test } from "bun:test"
import type { FormOption } from "@starboard/contracts"

import { DefaultCrmService } from "./crm.service"
import type { CrmDao, CustomerInsert, CustomerNameRow } from "../dao/crm.dao"

class InMemoryCrmDao implements CrmDao {
  private customers: Array<CustomerInsert> = []

  async listByOrganization(organizationId: string): Promise<FormOption[]> {
    return this.customers
      .filter((row) => row.organizationId === organizationId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((row) => ({ value: row.id, label: row.name }))
  }

  async insert(row: CustomerInsert): Promise<CustomerNameRow> {
    this.customers.push(row)
    return { id: row.id, name: row.name }
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
}

describe("DefaultCrmService org isolation", () => {
  test("org A cannot list or resolve org B customers", async () => {
    const dao = new InMemoryCrmDao()
    const service = new DefaultCrmService(dao)

    const orgA = await service.create("org-a", "Acme")
    const orgB = await service.create("org-b", "Beta Co")

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
    await expect(service.create("org-a", "  ")).rejects.toThrow(
      "Customer name is required"
    )
  })
})

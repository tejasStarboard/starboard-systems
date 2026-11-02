import { beforeEach, describe, expect, mock, test } from "bun:test"

const list = mock(() =>
  Promise.resolve({
    data: [{ id: "o1", name: "Acme", slug: "acme" }],
    error: null,
  })
)
const setActive = mock(() => Promise.resolve({ error: null }))
const create = mock(() => Promise.resolve({ data: { id: "o2" }, error: null }))

mock.module("@/lib/auth-client", () => ({
  authClient: {
    organization: {
      list,
      setActive,
      create,
    },
  },
}))

import {
  createAndEnterOrganizationRequest,
  listOrganizationsRequest,
  setActiveOrganizationRequest,
} from "./organization-requests"

describe("organization requests", () => {
  beforeEach(() => {
    list.mockClear()
    setActive.mockClear()
    create.mockClear()
  })

  test("listOrganizationsRequest returns orgs", async () => {
    await expect(listOrganizationsRequest()).resolves.toEqual({
      ok: true,
      organizations: [{ id: "o1", name: "Acme", slug: "acme" }],
    })
  })

  test("listOrganizationsRequest surfaces errors", async () => {
    list.mockImplementationOnce(() =>
      Promise.resolve({
        data: null,
        error: { message: "No session" },
      })
    )
    await expect(listOrganizationsRequest()).resolves.toEqual({
      ok: false,
      message: "No session",
    })
  })

  test("setActiveOrganizationRequest succeeds", async () => {
    await expect(setActiveOrganizationRequest("o1")).resolves.toEqual({
      ok: true,
    })
    expect(setActive).toHaveBeenCalledWith({ organizationId: "o1" })
  })

  test("createAndEnterOrganizationRequest creates then activates", async () => {
    await expect(
      createAndEnterOrganizationRequest({ name: "Beta", slug: "beta" })
    ).resolves.toEqual({ ok: true })
    expect(create).toHaveBeenCalledWith({ name: "Beta", slug: "beta" })
    expect(setActive).toHaveBeenCalledWith({ organizationId: "o2" })
  })

  test("createAndEnterOrganizationRequest marks created when activate fails", async () => {
    setActive.mockImplementationOnce(() =>
      Promise.resolve({ error: { message: "Denied" } })
    )
    await expect(
      createAndEnterOrganizationRequest({ name: "Beta", slug: "beta" })
    ).resolves.toEqual({
      ok: false,
      message: "Denied",
      created: true,
      title: "Organization created",
    })
  })
})

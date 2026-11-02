import { authClient } from "@/lib/auth-client"

export type OrganizationSummary = {
  id: string
  name: string
  slug: string
}

function errorMessage(error: { message?: string | null } | null | undefined) {
  return error?.message ?? "Something went wrong. Try again."
}

export async function listOrganizationsRequest(): Promise<
  | { ok: true; organizations: OrganizationSummary[] }
  | { ok: false; message: string }
> {
  const { data, error } = await authClient.organization.list()
  if (error) {
    return { ok: false, message: errorMessage(error) }
  }
  return { ok: true, organizations: data ?? [] }
}

export async function setActiveOrganizationRequest(
  organizationId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await authClient.organization.setActive({
    organizationId,
  })
  if (error) {
    return { ok: false, message: errorMessage(error) }
  }
  return { ok: true }
}

export async function createOrganizationRequest(input: {
  name: string
  slug: string
}): Promise<
  { ok: true; organizationId: string } | { ok: false; message: string }
> {
  const { data, error } = await authClient.organization.create(input)
  if (error || !data) {
    return { ok: false, message: errorMessage(error) }
  }
  return { ok: true, organizationId: data.id }
}

export async function createAndEnterOrganizationRequest(input: {
  name: string
  slug: string
}): Promise<
  | { ok: true }
  | { ok: false; message: string; created?: boolean; title?: string }
> {
  const created = await createOrganizationRequest(input)
  if (!created.ok) {
    return {
      ok: false,
      message: created.message,
      title: "Unable to create organization",
    }
  }
  const active = await setActiveOrganizationRequest(created.organizationId)
  if (!active.ok) {
    return {
      ok: false,
      message:
        active.message ||
        "Created, but could not enter it. Try selecting it below.",
      created: true,
      title: "Organization created",
    }
  }
  return { ok: true }
}

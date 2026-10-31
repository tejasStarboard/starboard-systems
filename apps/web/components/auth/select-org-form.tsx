"use client"

import { Buildings, Plus } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { Alert, AlertDescription } from "@starboard/lib-ui/components/alert"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import { Spinner } from "@starboard/lib-ui/components/spinner"

import { authClient } from "@/lib/auth-client"

type Organization = {
  id: string
  name: string
  slug: string
}

function toSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function SelectOrgForm() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enteringId, setEnteringId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)

  const loadOrganizations = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: listError } = await authClient.organization.list()

    if (listError) {
      setError(listError.message ?? "Unable to load organizations")
      setOrganizations([])
    } else {
      setOrganizations(data ?? [])
      if (!data?.length) {
        setShowCreate(true)
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadOrganizations()
  }, [loadOrganizations])

  async function enterOrganization(organizationId: string) {
    setEnteringId(organizationId)
    setError(null)

    const { error: activeError } = await authClient.organization.setActive({
      organizationId,
    })

    if (activeError) {
      setEnteringId(null)
      setError(activeError.message ?? "Unable to enter organization")
      return
    }

    router.push("/")
    router.refresh()
  }

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreating(true)
    setError(null)

    const orgSlug = slug || toSlug(name)

    const { data, error: createError } = await authClient.organization.create({
      name: name.trim(),
      slug: orgSlug,
    })

    if (createError || !data) {
      setCreating(false)
      setError(createError?.message ?? "Unable to create organization")
      return
    }

    const { error: activeError } = await authClient.organization.setActive({
      organizationId: data.id,
    })

    setCreating(false)

    if (activeError) {
      setError(
        activeError.message ?? "Organization created, but could not enter it"
      )
      await loadOrganizations()
      return
    }

    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8">
        <Spinner />
        <span className="text-xs text-muted-foreground">
          Loading organizations...
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-sm font-medium">Select organization</h1>
        <p className="text-xs text-muted-foreground">
          Choose an organization to continue, or create a new one.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {organizations.length > 0 ? (
        <div className="flex flex-col gap-2">
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              disabled={enteringId !== null}
              onClick={() => void enterOrganization(org.id)}
              className="flex w-full items-center gap-3 border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-50"
            >
              <span className="flex size-8 items-center justify-center bg-muted">
                <Buildings className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">
                  {org.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {org.slug}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {enteringId === org.id ? "Entering..." : "Enter"}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          You don&apos;t belong to any organizations yet.
        </p>
      )}

      <FieldSeparator>or</FieldSeparator>

      {showCreate ? (
        <form onSubmit={onCreate} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
              <Input
                id="org-name"
                name="name"
                value={name}
                onChange={(event) => {
                  const next = event.target.value
                  setName(next)
                  if (!slugTouched) {
                    setSlug(toSlug(next))
                  }
                }}
                required
                placeholder="Acme Shipping"
                autoComplete="organization"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="org-slug">Slug</FieldLabel>
              <Input
                id="org-slug"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true)
                  setSlug(toSlug(event.target.value))
                }}
                required
                placeholder="acme-shipping"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              />
            </Field>
          </FieldGroup>

          <div className="flex gap-2">
            {organizations.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={creating}
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
            ) : null}
            <Button type="submit" className="flex-1" disabled={creating}>
              {creating ? "Creating..." : "Create and enter"}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowCreate(true)}
        >
          <Plus data-icon="inline-start" />
          Create organization
        </Button>
      )}
    </div>
  )
}

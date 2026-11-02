"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { toast } from "@starboard/lib-ui/components/toast"

import { authClient } from "@/lib/auth-client"
import {
  createAndEnterOrganizationRequest,
  listOrganizationsRequest,
  setActiveOrganizationRequest,
  type OrganizationSummary,
} from "@/hooks/organization-requests"

export type { OrganizationSummary }

function errorMessage(error: { message?: string | null } | null | undefined) {
  return error?.message ?? "Something went wrong. Try again."
}

export function useOrganizations() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [enteringId, setEnteringId] = useState<string | null>(null)

  const loadOrganizations = useCallback(async () => {
    setLoading(true)
    const result = await listOrganizationsRequest()
    if (!result.ok) {
      toast.add({
        type: "error",
        title: "Unable to load organizations",
        description: result.message,
      })
      setOrganizations([])
    } else {
      setOrganizations(result.organizations)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadOrganizations()
  }, [loadOrganizations])

  const enterOrganization = useCallback(
    async (organizationId: string) => {
      setEnteringId(organizationId)
      const result = await setActiveOrganizationRequest(organizationId)
      if (!result.ok) {
        setEnteringId(null)
        toast.add({
          type: "error",
          title: "Unable to enter organization",
          description: result.message,
        })
        return { ok: false as const }
      }
      router.push("/")
      router.refresh()
      return { ok: true as const }
    },
    [router]
  )

  const createAndEnter = useCallback(
    async (input: { name: string; slug: string }) => {
      const result = await createAndEnterOrganizationRequest(input)
      if (!result.ok) {
        toast.add({
          type: "error",
          title: result.title ?? "Unable to create organization",
          description: result.message,
        })
        if (result.created) {
          await loadOrganizations()
        }
        return {
          ok: false as const,
          ...(result.created ? { created: true as const } : {}),
        }
      }
      router.push("/")
      router.refresh()
      return { ok: true as const }
    },
    [loadOrganizations, router]
  )

  return {
    organizations,
    loading,
    enteringId,
    loadOrganizations,
    enterOrganization,
    createAndEnter,
  }
}

export function useOrganizationInvitation(invitationId: string | null) {
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState<string | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!invitationId) {
      setLoadingInvite(false)
      return
    }
    let cancelled = false
    async function loadInvitation() {
      const { data, error } = await authClient.organization.getInvitation({
        query: { id: invitationId! },
      })
      if (cancelled) return
      if (error) {
        setLoadFailed(true)
        toast.add({
          type: "error",
          title: "Invitation not found",
          description: errorMessage(error),
        })
      } else if (data) {
        setOrganizationName(data.organizationName)
      }
      setLoadingInvite(false)
    }
    void loadInvitation()
    return () => {
      cancelled = true
    }
  }, [invitationId])

  const acceptInvitation = useCallback(async () => {
    if (!invitationId) return { ok: false as const }
    setPending(true)
    const { error } = await authClient.organization.acceptInvitation({
      invitationId,
    })
    setPending(false)
    if (error) {
      toast.add({
        type: "error",
        title: "Unable to accept invitation",
        description: errorMessage(error),
      })
      return { ok: false as const }
    }
    router.push("/select-org")
    router.refresh()
    return { ok: true as const }
  }, [invitationId, router])

  return {
    organizationName,
    loadFailed,
    loadingInvite,
    pending,
    acceptInvitation,
  }
}

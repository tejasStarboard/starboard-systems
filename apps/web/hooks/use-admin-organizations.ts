"use client"

import { useCallback, useState } from "react"

import { toast } from "@starboard/lib-ui/components/toast"

export type AdminOrgRow = {
  id: string
  name: string
  slug: string
  plan: string
}

export function useAdminOrganizations() {
  const [query, setQuery] = useState("")
  const [rows, setRows] = useState<AdminOrgRow[]>([])
  const [pending, setPending] = useState(false)

  const search = useCallback(
    async (q?: string) => {
      const nextQuery = q ?? query
      setPending(true)
      try {
        const response = await fetch(
          `/api/admin/organizations?q=${encodeURIComponent(nextQuery)}`
        )
        if (!response.ok) {
          throw new Error("Search failed")
        }
        const body = (await response.json()) as { organizations: AdminOrgRow[] }
        setRows(body.organizations)
      } catch (err) {
        toast.add({
          type: "error",
          title: "Search failed",
          description:
            err instanceof Error
              ? err.message
              : "Something went wrong. Try again.",
        })
      } finally {
        setPending(false)
      }
    },
    [query]
  )

  return { query, setQuery, rows, pending, search }
}

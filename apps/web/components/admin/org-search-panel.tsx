"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type OrgRow = {
  id: string
  name: string
  slug: string
  plan: string
}

export function OrgSearchPanel() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [rows, setRows] = useState<OrgRow[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/admin/organizations?q=${encodeURIComponent(query)}`
      )
      if (!response.ok) {
        throw new Error("Search failed")
      }
      const body = (await response.json()) as { organizations: OrgRow[] }
      setRows(body.organizations)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed")
    } finally {
      setPending(false)
    }
  }

  async function switchInto(organizationId: string) {
    setPending(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/impersonation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationId }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(body?.error ?? "Could not switch organization")
      }
      router.push("/")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Switch failed")
      setPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          void search()
        }}
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, slug, or id"
        />
        <Button type="submit" disabled={pending}>
          Search
        </Button>
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <ul className="divide-y divide-border border">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium">{row.name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {row.slug} · {row.id} · {row.plan}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => void switchInto(row.id)}
            >
              Switch into
            </Button>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted-foreground">
            No results yet. Run a search to list organizations.
          </li>
        ) : null}
      </ul>
    </div>
  )
}

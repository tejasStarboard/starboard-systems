"use client"

import { Button } from "@starboard/lib-ui/components/button"
import { Input } from "@starboard/lib-ui/components/input"

import { useAdminOrganizations } from "@/hooks/use-admin-organizations"
import { useImpersonation } from "@/hooks/use-impersonation"

export function OrgSearchPanel() {
  const {
    query,
    setQuery,
    rows,
    pending: searchPending,
    search,
  } = useAdminOrganizations()
  const { pending: switchPending, start } = useImpersonation()
  const pending = searchPending || switchPending

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
              onClick={() => void start(row.id)}
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

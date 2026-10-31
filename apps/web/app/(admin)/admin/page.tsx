import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/button"

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-sm font-medium">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Operate extension rollout and customer support across organizations.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/admin/extensions"
          className="border p-4 transition-colors hover:bg-muted/40"
        >
          <p className="text-sm font-medium">Extensions</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Off, common beta, custom beta list, or on for all entitled orgs.
          </p>
        </Link>
        <Link
          href="/admin/organizations"
          className="border p-4 transition-colors hover:bg-muted/40"
        >
          <p className="text-sm font-medium">Organizations</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Search tenants and switch into their shell context.
          </p>
        </Link>
        <Link
          href="/admin/settings"
          className="border p-4 transition-colors hover:bg-muted/40"
        >
          <p className="text-sm font-medium">Settings</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Maintain the shared common beta organization list.
          </p>
        </Link>
      </div>

      <div>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Back to app
        </Link>
      </div>
    </div>
  )
}

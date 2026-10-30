import { headers } from "next/headers"

import { auth } from "@/lib/auth"

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-sm font-medium">
          Welcome{session?.user.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="text-muted-foreground text-xs">
          Select a quote or open settings from the sidebar.
        </p>
      </div>
      <div className="bg-muted/50 min-h-[50vh] flex-1" />
    </div>
  )
}

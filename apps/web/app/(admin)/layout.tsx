import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { AdminShell } from "@/components/admin/admin-shell"
import { auth } from "@/lib/auth"
import { isStaffUserId } from "@/lib/auth/staff"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/login")
  }

  if (!isStaffUserId(session.user.id)) {
    notFound()
  }

  return (
    <AdminShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    >
      {children}
    </AdminShell>
  )
}

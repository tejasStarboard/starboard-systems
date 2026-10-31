import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { ServiceClientError } from "@/lib/clients/http"
import { isExtensionActive } from "@/lib/extensions"
import { getIngestionManager } from "@/lib/domain/ingestion.manager"

export async function POST(request: Request) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const organizationId = authResult.session.session.activeOrganizationId!
  const plan = await getOrganizationPlan(organizationId)
  if (!isExtensionActive("ingestion.fcl_v6", plan)) {
    return NextResponse.json(
      { error: "Extension ingestion.fcl_v6 is not enabled" },
      { status: 404 }
    )
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data" },
      { status: 400 }
    )
  }

  const file = form.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "file is required" }, { status: 400 })
  }

  try {
    const result = await getIngestionManager().enqueueFclV6Upload(
      organizationId,
      file
    )
    return NextResponse.json(result, { status: 202 })
  } catch (error) {
    if (error instanceof ServiceClientError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    throw error
  }
}

import { NextResponse } from "next/server"

import { requireActiveExtension } from "@/lib/auth/require-active-extension"
import { ServiceClientError } from "@/lib/clients/http"
import { getIngestionManager } from "@/lib/domain/ingestion/ingestion.manager"

export async function POST(request: Request) {
  const gate = await requireActiveExtension("ingestion.fcl_v6")
  if (gate.error) {
    return gate.error
  }
  const organizationId = gate.organizationId

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

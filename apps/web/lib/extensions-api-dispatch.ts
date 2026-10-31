import { NextResponse } from "next/server"
import { listManifests } from "@starboard/ext-host"

import { ServiceClientError } from "@/lib/clients/http"
import { getIngestionManager } from "@/lib/domain/ingestion/ingestion.manager"
import { getMessagingManager } from "@/lib/domain/messaging/messaging.manager"
import { getSpotManager } from "@/lib/domain/spot/spot.manager"

function serviceErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof ServiceClientError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return null
}

export async function dispatchExtensionGet(input: {
  extensionId: string
  path: string[]
  organizationId: string
}): Promise<NextResponse> {
  const { extensionId, path, organizationId } = input
  const manifest = listManifests().find((item) => item.id === extensionId)
  if (!manifest?.worker) {
    return NextResponse.json(
      { error: `Extension ${extensionId} is not enabled` },
      { status: 404 }
    )
  }

  const service = manifest.worker.service

  try {
    if (
      service === "spot" &&
      path[0] === "jobs" &&
      path[1] &&
      path.length === 2
    ) {
      const result = await getSpotManager().getJobStatus(
        extensionId,
        path[1],
        organizationId
      )
      return NextResponse.json(result)
    }

    if (
      service === "ingestion" &&
      path[0] === "jobs" &&
      path[1] &&
      path.length === 2
    ) {
      const result = await getIngestionManager().getJobStatus(
        organizationId,
        path[1]
      )
      return NextResponse.json(result)
    }

    if (
      service === "messaging" &&
      path.length === 1 &&
      path[0] === "connection"
    ) {
      const result = await getMessagingManager().getConnection(organizationId)
      return NextResponse.json(result)
    }

    if (
      service === "messaging" &&
      path.length === 1 &&
      path[0] === "messages"
    ) {
      const result = await getMessagingManager().listMessages(organizationId)
      return NextResponse.json(result)
    }
  } catch (error) {
    const response = serviceErrorResponse(error)
    if (response) {
      return response
    }
    throw error
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function dispatchExtensionPost(input: {
  extensionId: string
  path: string[]
  organizationId: string
  request: Request
}): Promise<NextResponse> {
  const { extensionId, path, organizationId, request } = input
  const manifest = listManifests().find((item) => item.id === extensionId)
  if (!manifest?.worker) {
    return NextResponse.json(
      { error: `Extension ${extensionId} is not enabled` },
      { status: 404 }
    )
  }

  const service = manifest.worker.service

  try {
    if (service === "spot" && path.length === 1 && path[0] === "jobs") {
      const body = (await request.json().catch(() => null)) as {
        origin?: string
        destination?: string
        mode?: string
      } | null
      const result = await getSpotManager().enqueueSearch(extensionId, {
        organizationId,
        origin: body?.origin,
        destination: body?.destination,
        mode: body?.mode,
      })
      return NextResponse.json(result, { status: 202 })
    }

    if (service === "ingestion" && path.length === 1 && path[0] === "jobs") {
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
      const result = await getIngestionManager().enqueueFclV6Upload(
        organizationId,
        file
      )
      return NextResponse.json(result, { status: 202 })
    }

    if (service === "messaging" && path.length === 1 && path[0] === "jobs") {
      const result = await getMessagingManager().enqueueSync(organizationId)
      return NextResponse.json(result, { status: 202 })
    }

    if (
      service === "messaging" &&
      path.length === 1 &&
      path[0] === "connection"
    ) {
      const started =
        await getMessagingManager().startConnection(organizationId)
      const result = await getMessagingManager().completeConnection(
        organizationId,
        "stub"
      )
      return NextResponse.json({
        ...result,
        authUrl: started.authUrl ?? null,
      })
    }

    if (service === "messaging" && path.length === 1 && path[0] === "send") {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return NextResponse.json(
          { error: "Expected JSON body" },
          { status: 400 }
        )
      }
      if (
        typeof body !== "object" ||
        body === null ||
        typeof (body as { toAddress?: unknown }).toAddress !== "string" ||
        typeof (body as { subject?: unknown }).subject !== "string" ||
        typeof (body as { body?: unknown }).body !== "string"
      ) {
        return NextResponse.json(
          { error: "toAddress, subject, and body are required" },
          { status: 400 }
        )
      }
      const payload = body as {
        toAddress: string
        subject: string
        body: string
        quoteId?: string
      }
      const result = await getMessagingManager().sendMail({
        organizationId,
        toAddress: payload.toAddress,
        subject: payload.subject,
        body: payload.body,
        quoteId: payload.quoteId,
      })
      return NextResponse.json(result)
    }
  } catch (error) {
    const response = serviceErrorResponse(error)
    if (response) {
      return response
    }
    throw error
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function dispatchExtensionDelete(input: {
  extensionId: string
  path: string[]
  organizationId: string
}): Promise<NextResponse> {
  const { extensionId, path, organizationId } = input
  const manifest = listManifests().find((item) => item.id === extensionId)
  if (!manifest?.worker || manifest.worker.service !== "messaging") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!(path.length === 1 && path[0] === "connection")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const result = await getMessagingManager().disconnect(organizationId)
    return NextResponse.json(result)
  } catch (error) {
    const response = serviceErrorResponse(error)
    if (response) {
      return response
    }
    throw error
  }
}

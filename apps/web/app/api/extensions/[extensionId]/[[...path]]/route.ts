import { NextResponse } from "next/server"
import { listManifests } from "@starboard/ext-host"

import { requireActiveExtension } from "@/lib/auth/require-active-extension"
import {
  dispatchExtensionDelete,
  dispatchExtensionGet,
  dispatchExtensionPost,
} from "@/lib/extensions-api-dispatch"

type RouteContext = {
  params: Promise<{
    extensionId: string
    path?: string[]
  }>
}

async function gateExtension(extensionId: string) {
  if (!listManifests().some((item) => item.id === extensionId)) {
    return {
      error: NextResponse.json(
        { error: `Extension ${extensionId} is not enabled` },
        { status: 404 }
      ),
    }
  }
  return requireActiveExtension(extensionId)
}

export async function GET(request: Request, context: RouteContext) {
  const { extensionId, path = [] } = await context.params
  const gate = await gateExtension(extensionId)
  if (gate.error) {
    return gate.error
  }
  return dispatchExtensionGet({
    extensionId,
    path,
    organizationId: gate.organizationId,
    request,
  })
}

export async function POST(request: Request, context: RouteContext) {
  const { extensionId, path = [] } = await context.params
  const gate = await gateExtension(extensionId)
  if (gate.error) {
    return gate.error
  }
  return dispatchExtensionPost({
    extensionId,
    path,
    organizationId: gate.organizationId,
    request,
  })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { extensionId, path = [] } = await context.params
  const gate = await gateExtension(extensionId)
  if (gate.error) {
    return gate.error
  }
  return dispatchExtensionDelete({
    extensionId,
    path,
    organizationId: gate.organizationId,
  })
}

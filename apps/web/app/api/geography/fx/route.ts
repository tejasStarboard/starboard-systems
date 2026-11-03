import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { ServiceClientError } from "@/lib/clients/http"
import { getGeographyClient } from "@/lib/domain/geography/geography.client"

/** Latest FX rates for a quote base (`?base=EUR`); provider fetched server-side. */
export async function GET(request: Request) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const base = new URL(request.url).searchParams.get("base") ?? ""

  try {
    const fx = await getGeographyClient().getFxRates(base)
    return NextResponse.json(fx)
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

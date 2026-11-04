import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { ServiceClientError } from "@/lib/clients/http"
import { getGeographyClient } from "@/lib/domain/geography/geography.client"

/** Currency options (geography seeds the ISO list on first read). */
export async function GET() {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  try {
    const currencies = await getGeographyClient().listCurrencyOptions()
    return NextResponse.json({ currencies })
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

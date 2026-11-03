"use client"

import { useEffect, useState } from "react"

import { countryFromCode } from "./route-geometry"
import type { PortOption } from "./options"

/** What the route map needs to know about one port code. */
export type PortGeo = {
  code: string
  country: string
  label?: string
  latitude?: number
  longitude?: number
}

const cache = new Map<string, PortGeo>()
const inflight = new Set<string>()
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

/** Remember a full search hit (picked on the map / combobox). */
export function rememberPort(option: PortOption) {
  const code = option.value.toUpperCase()
  cache.set(code, {
    code,
    country: option.country || countryFromCode(code),
    label: option.label,
    ...(option.latitude != null && option.longitude != null
      ? { latitude: option.latitude, longitude: option.longitude }
      : {}),
  })
  notify()
}

async function resolve(code: string) {
  if (inflight.has(code)) return
  inflight.add(code)
  try {
    const response = await fetch(
      `/api/geography/ports?q=${encodeURIComponent(code)}`
    )
    if (!response.ok) return
    const body = (await response.json()) as { ports?: PortOption[] }
    const hit = body.ports?.find((port) => port.value.toUpperCase() === code)
    if (hit) rememberPort(hit)
  } catch {
    // Offline / geo down: the map falls back to the code's country prefix.
  } finally {
    inflight.delete(code)
  }
}

/**
 * Geo details for saved port codes. Country comes from the UN/LOCODE prefix
 * immediately; lat/lng (+ label) fill in after one lookup per code.
 */
export function usePortGeo(codes: readonly string[]): Map<string, PortGeo> {
  const [, bump] = useState(0)
  useEffect(() => {
    const listener = () => bump((n) => n + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const key = codes.join("|")
  useEffect(() => {
    for (const raw of key.split("|")) {
      const code = raw.toUpperCase()
      if (code && !cache.has(code)) void resolve(code)
    }
  }, [key])

  const result = new Map<string, PortGeo>()
  for (const raw of codes) {
    const code = raw.toUpperCase()
    if (!code) continue
    result.set(
      code,
      cache.get(code) ?? { code, country: countryFromCode(code) }
    )
  }
  return result
}

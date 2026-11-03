"use client"

import { useMemo, useState } from "react"

import { Button } from "@starboard/lib-ui/components/button"
import { Field, FieldLabel } from "@starboard/lib-ui/components/field"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@starboard/lib-ui/components/toggle-group"

import type { ComboboxOption } from "../lib/options"
import {
  countryFromCode,
  fitViewBox,
  project,
  routePath,
  WORLD_VIEWBOX,
  type Box,
  type Point,
} from "../lib/route-geometry"
import { rememberPort, usePortGeo, type PortGeo } from "../lib/use-port-geo"
import { WORLD_COUNTRIES } from "../lib/world-countries.generated"
import { PortCombobox } from "./port-combobox"
import {
  RouteMapSvg,
  useAnimatedViewBox,
  type MapMarker,
} from "./route-map-svg"

export type RouteMapField =
  "origin" | "destination" | "originVia" | "destinationVia"

/**
 * Props `quoting.document` passes into `quoting.slots.laneRoute` for FCL lanes
 * (structural copy of `LaneRouteSlotProps` — this package cannot import the
 * document package without a dependency cycle).
 */
export type RouteMapFieldsProps = {
  origin: string
  destination: string
  originVia: string
  destinationVia: string
  /** Seed options so saved codes resolve to labels. */
  portOptions: ComboboxOption[]
  /** Dom id prefix for labels. */
  idPrefix?: string
  onChange: (field: RouteMapField, value: string) => void
}

const SHAPES = new Map(WORLD_COUNTRIES.map((c) => [c.id, c]))

function pointFor(geo: PortGeo | undefined, fallbackToCountry: boolean) {
  if (!geo) return null
  if (geo.latitude != null && geo.longitude != null) {
    return { point: project(geo.latitude, geo.longitude), exact: true }
  }
  if (!fallbackToCountry) return null
  const shape = SHAPES.get(geo.country)
  return shape ? { point: project(shape.lat, shape.lng), exact: false } : null
}

/**
 * FCL route: stylized world map → country → seaport combobox, curve between
 * ports (via checkpoints when lat/lng exist), plus the always-on "Find port"
 * search. Contributed by `geo.gazetteer` into `quoting.slots.laneRoute`.
 */
export function RouteMapFields({
  origin,
  destination,
  originVia,
  destinationVia,
  portOptions,
  idPrefix = "route",
  onChange,
}: RouteMapFieldsProps) {
  const [target, setTarget] = useState<"origin" | "destination">(
    origin && !destination ? "destination" : "origin"
  )
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [pickerCountry, setPickerCountry] = useState<string | null>(null)
  const [showWorld, setShowWorld] = useState(false)

  const geo = usePortGeo([origin, destination, originVia, destinationVia])
  const geoOf = (code: string) => geo.get(code.toUpperCase())

  const bothSet = Boolean(origin && destination)
  const originPoint = origin ? pointFor(geoOf(origin), true) : null
  const destinationPoint = destination
    ? pointFor(geoOf(destination), true)
    : null
  const originViaPoint = originVia ? pointFor(geoOf(originVia), false) : null
  const destinationViaPoint = destinationVia
    ? pointFor(geoOf(destinationVia), false)
    : null

  const markers: MapMarker[] = []
  const addMarker = (
    kind: MapMarker["kind"],
    code: string,
    hit: { point: Point } | null
  ) => {
    if (hit) {
      markers.push({
        key: `${kind}-${code}`,
        kind,
        label: code.toUpperCase(),
        ...hit.point,
      })
    }
  }
  addMarker("origin", origin, originPoint)
  addMarker("destination", destination, destinationPoint)
  addMarker("via", originVia, originViaPoint)
  addMarker("via", destinationVia, destinationViaPoint)
  const path =
    originPoint && destinationPoint
      ? routePath([
          originPoint.point,
          ...(originViaPoint ? [originViaPoint.point] : []),
          ...(destinationViaPoint ? [destinationViaPoint.point] : []),
          destinationPoint.point,
        ])
      : ""

  const originCountry = origin
    ? (geoOf(origin)?.country ?? countryFromCode(origin))
    : ""
  const destinationCountry = destination
    ? (geoOf(destination)?.country ?? countryFromCode(destination))
    : ""
  const activeIds = useMemo(
    () => new Set([originCountry, destinationCountry].filter(Boolean)),
    [originCountry, destinationCountry]
  )

  let fitTarget = WORLD_VIEWBOX
  if (bothSet && !showWorld) {
    const boxes: Box[] = []
    for (const id of [originCountry, destinationCountry]) {
      const shape = SHAPES.get(id)
      if (shape) boxes.push(shape.box)
    }
    for (const marker of markers) {
      boxes.push([marker.x, marker.y, marker.x, marker.y])
    }
    fitTarget = fitViewBox(boxes)
  }
  const viewBox = useAnimatedViewBox(fitTarget)

  const hovered = hoverId ? SHAPES.get(hoverId) : null
  const picker = pickerCountry ? SHAPES.get(pickerCountry) : null
  const targetValue = target === "origin" ? origin : destination
  const targetCountry = target === "origin" ? originCountry : destinationCountry
  const id = (name: string) => `${idPrefix}-${name}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup
          value={[target]}
          onValueChange={(value) => {
            const next = value[0]
            if (next === "origin" || next === "destination") setTarget(next)
          }}
          variant="outline"
          size="sm"
          aria-label="Port to pick on the map"
        >
          <ToggleGroupItem value="origin">
            Origin{origin ? ` · ${origin}` : ""}
          </ToggleGroupItem>
          <ToggleGroupItem value="destination">
            Destination{destination ? ` · ${destination}` : ""}
          </ToggleGroupItem>
        </ToggleGroup>
        {bothSet ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowWorld((v) => !v)}
          >
            {showWorld ? "Fit route" : "World view"}
          </Button>
        ) : null}
      </div>

      <div className="relative">
        <RouteMapSvg
          viewBox={viewBox}
          hoverId={hoverId}
          activeIds={activeIds}
          markers={markers}
          path={path}
          onHover={setHoverId}
          onSelect={(countryId) =>
            setPickerCountry((current) =>
              current === countryId ? null : countryId
            )
          }
        />
        <p className="pointer-events-none absolute right-2 bottom-2 rounded bg-background/80 px-2 py-0.5 text-xs text-muted-foreground">
          {hovered
            ? hovered.name
            : `Click a country to pick the ${target} seaport`}
        </p>
        {picker ? (
          <div className="absolute top-3 left-3 z-10 flex w-[min(18rem,calc(100%-1.5rem))] flex-col gap-2 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {target === "origin" ? "Origin" : "Destination"} · {picker.name}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setPickerCountry(null)}
              >
                Close
              </Button>
            </div>
            <PortCombobox
              key={`${target}-${picker.id}`}
              defaultOpen
              country={picker.id}
              type="seaport"
              value={targetCountry === picker.id ? targetValue : ""}
              placeholder={`Search seaport in ${picker.name}…`}
              onChange={(value) => {
                if (!value) return
                onChange(target, value)
                setShowWorld(false)
                setPickerCountry(null)
                if (target === "origin" && !destination) {
                  setTarget("destination")
                }
              }}
              onSelect={(option) => {
                if (option) rememberPort(option)
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={id("origin")}>Find origin port</FieldLabel>
          <PortCombobox
            id={id("origin")}
            options={portOptions}
            value={origin}
            onChange={(value) => onChange("origin", value)}
            onSelect={(option) => option && rememberPort(option)}
            placeholder="UNLOCODE or name"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={id("destination")}>
            Find destination port
          </FieldLabel>
          <PortCombobox
            id={id("destination")}
            options={portOptions}
            value={destination}
            onChange={(value) => onChange("destination", value)}
            onSelect={(option) => option && rememberPort(option)}
            placeholder="UNLOCODE or name"
          />
        </Field>
        {bothSet ? (
          <>
            <Field>
              <FieldLabel htmlFor={id("originVia")}>Origin via</FieldLabel>
              <PortCombobox
                id={id("originVia")}
                options={portOptions}
                value={originVia}
                onChange={(value) => onChange("originVia", value)}
                onSelect={(option) => option && rememberPort(option)}
                placeholder="Optional via port"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={id("destinationVia")}>
                Destination via
              </FieldLabel>
              <PortCombobox
                id={id("destinationVia")}
                options={portOptions}
                value={destinationVia}
                onChange={(value) => onChange("destinationVia", value)}
                onSelect={(option) => option && rememberPort(option)}
                placeholder="Optional via port"
              />
            </Field>
          </>
        ) : null}
      </div>
    </div>
  )
}

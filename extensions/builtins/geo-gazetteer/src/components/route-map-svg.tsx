"use client"

import { memo, useEffect, useRef, useState } from "react"

import { cn } from "@starboard/lib-ui/lib/utils"

import {
  lerpViewBox,
  viewBoxAttr,
  WORLD_VIEWBOX,
  type ViewBox,
} from "../lib/route-geometry"
import { WORLD_COUNTRIES } from "../lib/world-countries.generated"

export type MapMarker = {
  key: string
  x: number
  y: number
  kind: "origin" | "destination" | "via"
  label: string
}

const ZOOM_MS = 700

/** Tween the SVG viewBox (ease-in-out); jumps when reduced motion is on. */
export function useAnimatedViewBox(target: ViewBox): ViewBox {
  const [current, setCurrent] = useState<ViewBox>(WORLD_VIEWBOX)
  const fromRef = useRef(current)
  fromRef.current = current
  const targetRef = useRef(target)
  targetRef.current = target
  const key = viewBoxAttr(target)

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const to = targetRef.current
    if (reduce) {
      setCurrent(to)
      return
    }
    const from = fromRef.current
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ZOOM_MS)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      setCurrent(lerpViewBox(from, to, eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [key])

  return current
}

type CountryLayerProps = {
  hoverId: string | null
  activeIds: ReadonlySet<string>
  disabled?: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

/** Static country shapes — memoized so zoom frames never re-render 170 paths. */
const CountryLayer = memo(function CountryLayer({
  hoverId,
  activeIds,
  disabled,
  onHover,
  onSelect,
}: CountryLayerProps) {
  return (
    <g>
      {WORLD_COUNTRIES.map((country) => {
        const active = activeIds.has(country.id)
        const hover = hoverId === country.id
        return (
          <path
            key={country.id}
            d={country.d}
            data-country={country.id}
            aria-label={country.name}
            vectorEffect="non-scaling-stroke"
            strokeWidth={0.6}
            className={cn(
              "stroke-background transition-colors duration-200",
              active
                ? "fill-primary/70"
                : hover
                  ? "fill-primary/35"
                  : "fill-muted-foreground/25",
              !disabled && "cursor-pointer"
            )}
            onPointerEnter={() => onHover(country.id)}
            onPointerLeave={() => onHover(null)}
            onClick={() => {
              if (!disabled) onSelect(country.id)
            }}
          />
        )
      })}
    </g>
  )
})

export function RouteMapSvg({
  viewBox,
  hoverId,
  activeIds,
  markers,
  path,
  disabled,
  onHover,
  onSelect,
}: {
  viewBox: ViewBox
  hoverId: string | null
  activeIds: ReadonlySet<string>
  markers: MapMarker[]
  /** Combined route curve (origin → vias → destination). */
  path: string
  disabled?: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}) {
  // Keep marker / stroke sizes constant on screen while zooming.
  const unit = viewBox.w / WORLD_VIEWBOX.w
  return (
    <svg
      viewBox={viewBoxAttr(viewBox)}
      role="img"
      aria-label="World map: choose a country to pick a seaport"
      className="block h-auto w-full rounded-lg bg-muted/40"
    >
      <rect
        x={0}
        y={0}
        width={WORLD_VIEWBOX.w}
        height={WORLD_VIEWBOX.h}
        className="fill-primary/5"
      />
      <CountryLayer
        hoverId={hoverId}
        activeIds={activeIds}
        disabled={disabled}
        onHover={onHover}
        onSelect={onSelect}
      />
      {path ? (
        <g className="pointer-events-none">
          <path
            key={path}
            d={path}
            pathLength={1}
            fill="none"
            strokeLinecap="round"
            strokeDasharray="1"
            className="stroke-primary"
            strokeWidth={2.2 * unit}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="1"
              to="0"
              dur="1.1s"
              fill="freeze"
            />
          </path>
          <circle r={3 * unit} className="fill-primary">
            <animateMotion
              key={path}
              dur="4.5s"
              repeatCount="indefinite"
              path={path}
            />
          </circle>
        </g>
      ) : null}
      <g className="pointer-events-none">
        {markers.map((marker) => {
          const r = (marker.kind === "via" ? 3 : 4.5) * unit
          return (
            <g key={marker.key}>
              {marker.kind !== "via" ? (
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={r}
                  className="fill-primary/40"
                >
                  <animate
                    attributeName="r"
                    values={`${r};${r * 2.4};${r}`}
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </circle>
              ) : null}
              <circle
                cx={marker.x}
                cy={marker.y}
                r={r}
                strokeWidth={1.2 * unit}
                className={cn(
                  "stroke-background",
                  marker.kind === "via" ? "fill-amber-500" : "fill-primary"
                )}
              />
              <text
                x={marker.x}
                y={marker.y - r - 3 * unit}
                textAnchor="middle"
                fontSize={9 * unit}
                className="fill-foreground font-medium"
                paintOrder="stroke"
                strokeWidth={2.5 * unit}
                stroke="var(--background)"
              >
                {marker.label}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

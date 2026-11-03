import {
  WORLD_HEIGHT,
  WORLD_LAT_TOP,
  WORLD_WIDTH,
} from "./world-countries.generated"

/** Stylized (non-GIS) geometry for the FCL route map. */

export type Point = { x: number; y: number }
export type ViewBox = { x: number; y: number; w: number; h: number }
export type Box = readonly [number, number, number, number]

export const WORLD_VIEWBOX: ViewBox = {
  x: 0,
  y: 0,
  w: WORLD_WIDTH,
  h: WORLD_HEIGHT,
}

const ASPECT = WORLD_WIDTH / WORLD_HEIGHT
const MIN_ZOOM_WIDTH = 140

/** Equirectangular projection matching `world-countries.generated`. */
export function project(latitude: number, longitude: number): Point {
  return {
    x: ((longitude + 180) / 360) * WORLD_WIDTH,
    y: ((WORLD_LAT_TOP - latitude) / 360) * WORLD_WIDTH,
  }
}

/** UN/LOCODE (and most IATA-style soft codes) start with the ISO-2 country. */
export function countryFromCode(code: string): string {
  const prefix = code.trim().slice(0, 2).toUpperCase()
  return /^[A-Z]{2}$/.test(prefix) ? prefix : ""
}

/** Quadratic arc between two points, lifted "up" for a great-circle feel. */
function arcControl(a: Point, b: Point, lift: number): Point {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  let nx = dy / len
  let ny = -dx / len
  if (ny > 0) {
    nx = -nx
    ny = -ny
  }
  return {
    x: (a.x + b.x) / 2 + nx * len * lift,
    y: (a.y + b.y) / 2 + ny * len * lift,
  }
}

const fmt = (n: number) => Math.round(n * 10) / 10

/** One continuous SVG path: a lifted arc per consecutive pair of points. */
export function routePath(points: readonly Point[], lift = 0.2): string {
  if (points.length < 2) return ""
  const [first, ...rest] = points
  let d = `M${fmt(first!.x)},${fmt(first!.y)}`
  let prev = first!
  for (const next of rest) {
    const c = arcControl(prev, next, lift)
    d += `Q${fmt(c.x)},${fmt(c.y)} ${fmt(next.x)},${fmt(next.y)}`
    prev = next
  }
  return d
}

/**
 * ViewBox that frames every box (country bounds / port points) with padding,
 * keeping the world aspect ratio and staying inside the world.
 */
export function fitViewBox(boxes: readonly Box[], padding = 0.25): ViewBox {
  if (boxes.length === 0) return WORLD_VIEWBOX
  const x0 = Math.min(...boxes.map((b) => b[0]))
  const y0 = Math.min(...boxes.map((b) => b[1]))
  const x1 = Math.max(...boxes.map((b) => b[2]))
  const y1 = Math.max(...boxes.map((b) => b[3]))
  const bw = x1 - x0
  const bh = y1 - y0
  // Extra headroom: arcs lift above the straight line between the ports.
  const w = Math.max(
    bw * (1 + 2 * padding),
    bh * (1 + 2 * padding) * ASPECT,
    MIN_ZOOM_WIDTH
  )
  if (w >= WORLD_WIDTH) return WORLD_VIEWBOX
  const h = w / ASPECT
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  return {
    x: clamp(cx - w / 2, 0, WORLD_WIDTH - w),
    y: clamp(cy - h / 2, 0, WORLD_HEIGHT - h),
    w,
    h,
  }
}

export function lerpViewBox(a: ViewBox, b: ViewBox, t: number): ViewBox {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    w: a.w + (b.w - a.w) * t,
    h: a.h + (b.h - a.h) * t,
  }
}

export function viewBoxAttr(v: ViewBox): string {
  return `${fmt(v.x)} ${fmt(v.y)} ${fmt(v.w)} ${fmt(v.h)}`
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

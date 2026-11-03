import { describe, expect, test } from "bun:test"

import {
  countryFromCode,
  fitViewBox,
  lerpViewBox,
  project,
  routePath,
  WORLD_VIEWBOX,
} from "./route-geometry"

describe("route-geometry", () => {
  test("project maps lng/lat into the world viewBox", () => {
    expect(project(0, -180).x).toBe(0)
    expect(project(0, 180).x).toBe(WORLD_VIEWBOX.w)
    expect(project(84, 0).y).toBe(0)
  })

  test("countryFromCode reads the ISO-2 prefix", () => {
    expect(countryFromCode("cnsha")).toBe("CN")
    expect(countryFromCode("")).toBe("")
    expect(countryFromCode("1X")).toBe("")
  })

  test("routePath chains one lifted arc per segment", () => {
    const a = { x: 100, y: 100 }
    const b = { x: 300, y: 100 }
    const c = { x: 500, y: 140 }
    expect(routePath([a])).toBe("")
    expect(routePath([a, b]).match(/Q/g)).toHaveLength(1)
    const via = routePath([a, b, c])
    expect(via.match(/Q/g)).toHaveLength(2)
    // Arc bows upward (control point above the straight line).
    expect(routePath([a, b])).toBe("M100,100Q200,60 300,100")
  })

  test("fitViewBox frames both boxes inside the world", () => {
    const view = fitViewBox([
      [700, 150, 760, 200],
      [820, 160, 880, 220],
    ])
    expect(view.w).toBeLessThan(WORLD_VIEWBOX.w)
    expect(view.x).toBeLessThanOrEqual(700)
    expect(view.x + view.w).toBeGreaterThanOrEqual(880)
    expect(view.y).toBeLessThanOrEqual(150)
    expect(view.y + view.h).toBeGreaterThanOrEqual(220)
    expect(view.x + view.w).toBeLessThanOrEqual(WORLD_VIEWBOX.w)
  })

  test("fitViewBox falls back to the whole world for far-apart ports", () => {
    expect(
      fitViewBox([
        [20, 100, 60, 140],
        [900, 200, 960, 260],
      ])
    ).toEqual(WORLD_VIEWBOX)
    expect(fitViewBox([])).toEqual(WORLD_VIEWBOX)
  })

  test("lerpViewBox interpolates", () => {
    const mid = lerpViewBox(
      { x: 0, y: 0, w: 100, h: 50 },
      { x: 100, y: 50, w: 200, h: 100 },
      0.5
    )
    expect(mid).toEqual({ x: 50, y: 25, w: 150, h: 75 })
  })
})

import * as React from "react"

export type Breakpoint = "mobile" | "tablet" | "desktop"

const TABLET_MIN = 768
const DESKTOP_MIN = 1280

function resolveBreakpoint(width: number): Breakpoint {
  if (width < TABLET_MIN) return "mobile"
  if (width < DESKTOP_MIN) return "tablet"
  return "desktop"
}

/** Returns the active layout breakpoint. Defaults to desktop until measured. */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("desktop")

  React.useEffect(() => {
    const update = () => setBreakpoint(resolveBreakpoint(window.innerWidth))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return breakpoint
}

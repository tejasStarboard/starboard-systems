"use client"

import * as React from "react"

/**
 * Disables the browser context menu app-wide (IDE-style chrome).
 * Text selection is handled in lib-ui globals.css.
 */
export function AppInteractionGuard({
  children,
}: {
  children: React.ReactNode
}) {
  React.useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }
    document.addEventListener("contextmenu", onContextMenu)
    return () => document.removeEventListener("contextmenu", onContextMenu)
  }, [])

  return children
}

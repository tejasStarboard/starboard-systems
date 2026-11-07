import * as React from "react"

/**
 * Observe an element's content width (e.g. a resizable workbench panel).
 * Prefer this over viewport breakpoints when layout depends on the local
 * container, not the screen.
 */
export function useElementWidth<T extends HTMLElement = HTMLDivElement>(): {
  ref: React.RefCallback<T>
  width: number
} {
  const [node, setNode] = React.useState<T | null>(null)
  const [width, setWidth] = React.useState(0)

  const ref = React.useCallback((element: T | null) => {
    setNode(element)
  }, [])

  React.useLayoutEffect(() => {
    if (!node) return

    const update = (next: number) => {
      setWidth((prev) => (prev === next ? prev : next))
    }

    update(node.getBoundingClientRect().width)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      update(entry.contentRect.width)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return { ref, width }
}

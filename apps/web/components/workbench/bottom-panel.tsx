"use client"

import { useWorkbench } from "@/components/workbench/workbench-context"
import { Button } from "@starboard/lib-ui/components/button"

/** Stub panel region + contribution-driven status bar (Preview, …). */
export function BottomPanel() {
  const { panelOpen, togglePanel, contributions, openEditor } = useWorkbench()

  return (
    <>
      {panelOpen ? (
        <section
          aria-label="Panel"
          data-region="panel"
          className="h-40 shrink-0 overflow-auto border-t bg-background p-3 text-xs text-muted-foreground"
        >
          No panel views contributed.
        </section>
      ) : null}
      <footer
        data-region="status-bar"
        className="flex h-6 shrink-0 items-center gap-2 border-t bg-muted/40 px-2 text-xs"
      >
        <Button
          variant="ghost"
          size="xs"
          aria-pressed={panelOpen}
          onClick={togglePanel}
        >
          Panel
        </Button>
        {contributions.statusBar.map((item) => {
          if (!item.opens) return null
          const opens = item.opens
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="xs"
              data-testid={`status-bar-${item.id}`}
              onClick={() => openEditor({ ...opens, side: "beside" })}
            >
              {item.label}
            </Button>
          )
        })}
      </footer>
    </>
  )
}

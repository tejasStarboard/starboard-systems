"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@starboard/lib-ui/components/resizable"

export function CustomerSplitPanes({
  list,
  detail,
}: {
  list: React.ReactNode
  detail: React.ReactNode
}) {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-[calc(100svh-var(--header-height))] min-h-0 flex-1 overflow-hidden"
    >
      <ResizablePanel
        defaultSize={"30"}
        minSize={220}
        maxSize={560}
        className="flex min-h-0 flex-col overflow-hidden bg-background"
      >
        {list}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        defaultSize="70"
        minSize={360}
        className="flex min-h-0 min-w-0 flex-col overflow-hidden"
      >
        {detail}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

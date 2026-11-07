"use client"

import {
  SquareSplitHorizontalIcon,
  ArrowLineLeftIcon,
  ArrowLineRightIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react"
import * as React from "react"

import { NewTabWelcome } from "@/components/workbench/new-tab-welcome"
import { useWorkbench } from "@/components/workbench/workbench-context"
import {
  builtinEditors,
  builtinPointComponents,
} from "@/lib/workbench/builtin-editors"
import type { EditorGroupId, EditorTab } from "@/lib/workbench/types"
import { Button } from "@starboard/lib-ui/components/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@starboard/lib-ui/components/resizable"
import { cn } from "@starboard/lib-ui/lib/utils"

/** HTML5 DnD payload for moving editor tabs between split panes. */
const TAB_MIME = "application/x-starboard-editor-tab"

type TabDragContextValue = {
  draggingTabId: string | null
  setDraggingTabId: (id: string | null) => void
}

const TabDragContext = React.createContext<TabDragContextValue>({
  draggingTabId: null,
  setDraggingTabId: () => {},
})

function useTabDrag() {
  return React.useContext(TabDragContext)
}

function TabStrip({
  groupId,
  tabs,
  activeTabId,
  focused,
}: {
  groupId: EditorGroupId
  tabs: EditorTab[]
  activeTabId: string | null
  focused: boolean
}) {
  const {
    focusTab,
    closeEditorTab,
    moveEditorTab,
    splitEditorRight,
    splitOpen,
    focusGroup,
    showNewTab,
    tabs: allTabs,
  } = useWorkbench()
  const { draggingTabId, setDraggingTabId } = useTabDrag()
  const [edgeHot, setEdgeHot] = React.useState(false)
  const [stripHot, setStripHot] = React.useState(false)

  const draggingTab = draggingTabId
    ? allTabs.find((tab) => tab.id === draggingTabId)
    : undefined
  const canDropOnEdge =
    Boolean(draggingTab) &&
    draggingTab!.groupId === "primary" &&
    groupId === "primary" &&
    // Need another primary tab (or allow emptying primary — Cursor allows one).
    true
  const canDropOnStrip =
    Boolean(draggingTab) && draggingTab!.groupId !== groupId

  function readTabId(event: React.DragEvent): string | null {
    return (
      event.dataTransfer.getData(TAB_MIME) ||
      event.dataTransfer.getData("text/plain") ||
      null
    )
  }

  function acceptTabDrag(event: React.DragEvent) {
    if (
      event.dataTransfer.types.includes(TAB_MIME) ||
      event.dataTransfer.types.includes("text/plain")
    ) {
      event.preventDefault()
      event.dataTransfer.dropEffect = "move"
    }
  }

  return (
    <div
      role="tablist"
      aria-label={
        groupId === "primary" ? "Primary editors" : "Secondary editors"
      }
      data-region="editor-tabs"
      data-group={groupId}
      data-drop-active={stripHot ? "true" : undefined}
      className={cn(
        "flex h-9 w-full min-w-0 shrink-0 items-stretch overflow-x-auto border-b bg-muted/40",
        focused && "bg-muted/60",
        stripHot && canDropOnStrip && "bg-primary/10"
      )}
      onMouseDown={() => focusGroup(groupId)}
      onDragEnter={(event) => {
        if (!canDropOnStrip) return
        acceptTabDrag(event)
        setStripHot(true)
      }}
      onDragOver={(event) => {
        if (!canDropOnStrip) return
        acceptTabDrag(event)
      }}
      onDragLeave={(event) => {
        const related = event.relatedTarget as Node | null
        if (related && event.currentTarget.contains(related)) return
        setStripHot(false)
      }}
      onDrop={(event) => {
        setStripHot(false)
        setEdgeHot(false)
        if (!canDropOnStrip) return
        event.preventDefault()
        const id = readTabId(event)
        if (!id) return
        moveEditorTab(id, groupId)
        setDraggingTabId(null)
      }}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="New Tab"
        data-testid={`new-tab-button-${groupId}`}
        title="New Tab"
        className={cn(
          "m-1 shrink-0",
          activeTabId === null && "bg-background text-foreground"
        )}
        aria-pressed={activeTabId === null}
        onClick={() => showNewTab(groupId)}
      >
        <PlusIcon className="size-3.5" />
      </Button>
      {tabs.map((tab) => {
        const active = tab.id === activeTabId
        const dragging = draggingTabId === tab.id
        return (
          <div
            key={tab.id}
            draggable
            data-testid={`editor-tab-${tab.id}`}
            data-dragging={dragging ? "true" : undefined}
            className={cn(
              "group flex max-w-56 cursor-grab items-center border-r text-sm active:cursor-grabbing",
              active ? "bg-background" : "text-muted-foreground hover:bg-muted",
              dragging && "opacity-50"
            )}
            onDragStart={(event) => {
              event.dataTransfer.setData(TAB_MIME, tab.id)
              event.dataTransfer.setData("text/plain", tab.id)
              event.dataTransfer.effectAllowed = "move"
              setDraggingTabId(tab.id)
            }}
            onDragEnd={() => {
              setDraggingTabId(null)
              setEdgeHot(false)
              setStripHot(false)
            }}
          >
            <Button
              type="button"
              variant="ghost"
              role="tab"
              aria-selected={active}
              title={`${tab.viewType}:${tab.resourceId}`}
              className="h-auto min-w-0 flex-1 justify-start truncate rounded-none px-3 py-2 text-left font-normal"
              onClick={() => focusTab(tab.id)}
            >
              {tab.title}
            </Button>
            {splitOpen ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={
                  groupId === "primary"
                    ? `Move ${tab.title} to right`
                    : `Move ${tab.title} to left`
                }
                className="opacity-0 group-hover:opacity-60 hover:opacity-100"
                onClick={() =>
                  moveEditorTab(
                    tab.id,
                    groupId === "primary" ? "secondary" : "primary"
                  )
                }
              >
                {groupId === "primary" ? (
                  <ArrowLineRightIcon className="size-3" />
                ) : (
                  <ArrowLineLeftIcon className="size-3" />
                )}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Close ${tab.title}`}
              className="mr-1 opacity-60 hover:opacity-100"
              onClick={() => closeEditorTab(tab.id)}
              onMouseDown={(event) => event.stopPropagation()}
              // Avoid starting a tab drag from the close control.
              draggable={false}
            >
              <XIcon className="size-3" />
            </Button>
          </div>
        )
      })}

      {/* Far-right edge: drop here to open / move into the right split (Cursor). */}
      {groupId === "primary" ? (
        <div
          role="button"
          aria-label="Drop tab here to split right"
          data-testid="tab-split-drop-zone"
          data-hot={edgeHot ? "true" : undefined}
          className={cn(
            "ml-auto flex h-full w-10 shrink-0 items-center justify-center border-l border-transparent transition-colors",
            draggingTabId && canDropOnEdge && "border-dashed border-border/80",
            edgeHot &&
              canDropOnEdge &&
              "border-primary bg-primary/15 ring-1 ring-primary/40 ring-inset"
          )}
          onDragEnter={(event) => {
            if (!draggingTab || draggingTab.groupId !== "primary") return
            acceptTabDrag(event)
            setEdgeHot(true)
          }}
          onDragOver={(event) => {
            if (!draggingTab || draggingTab.groupId !== "primary") return
            acceptTabDrag(event)
            setEdgeHot(true)
          }}
          onDragLeave={(event) => {
            const related = event.relatedTarget as Node | null
            if (related && event.currentTarget.contains(related)) return
            setEdgeHot(false)
          }}
          onDrop={(event) => {
            setEdgeHot(false)
            event.preventDefault()
            event.stopPropagation()
            const id = readTabId(event)
            if (!id) return
            const tab = allTabs.find((item) => item.id === id)
            if (!tab || tab.groupId !== "primary") return
            moveEditorTab(id, "secondary")
            setDraggingTabId(null)
          }}
        >
          {draggingTabId && canDropOnEdge ? (
            <SquareSplitHorizontalIcon
              className={cn(
                "size-3.5 text-muted-foreground",
                edgeHot && "text-primary"
              )}
              aria-hidden
            />
          ) : !splitOpen && activeTabId ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label="Split editor right"
              data-testid="split-editor-right"
              title="Split editor right"
              onClick={() => splitEditorRight()}
            >
              <SquareSplitHorizontalIcon className="size-3.5" />
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="ml-auto" />
      )}
    </div>
  )
}

function EditorPane({ groupId }: { groupId: EditorGroupId }) {
  const {
    tabsForGroup,
    activeByGroup,
    focusedGroup,
    contributions,
    openEditor,
    renameTab,
    focusGroup,
  } = useWorkbench()

  const tabs = tabsForGroup(groupId)
  const activeTabId = activeByGroup[groupId]
  const active = tabs.find((tab) => tab.id === activeTabId)
  const focused = focusedGroup === groupId
  const editor = active
    ? contributions.editors.find((e) => e.viewType === active.viewType)
    : undefined
  const Provided = editor ? builtinEditors[editor.viewType] : undefined

  const host = React.useMemo(
    () => ({
      openEditor,
      setEditorTitle: active
        ? (title: string) => renameTab(active.id, title)
        : undefined,
      activeEditor: active
        ? { viewType: active.viewType, resourceId: active.resourceId }
        : null,
      pointComponents: builtinPointComponents,
      slots: contributions.points,
    }),
    [openEditor, renameTab, active, contributions.points]
  )

  let content: React.ReactNode
  if (active && Provided) {
    content = (
      <Provided
        key={active.id}
        resourceId={active.resourceId}
        title={active.title}
        host={host}
      />
    )
  } else if (active && !editor?.deepLink) {
    content = (
      <div
        data-testid="stub-editor"
        className="flex flex-1 flex-col gap-1 p-4 text-sm"
      >
        <h2 className="font-medium">{active.title}</h2>
        <p className="text-xs text-muted-foreground">
          viewType <code>{active.viewType}</code> · resource{" "}
          <code>{active.resourceId}</code>
          {editor ? "" : " — no editor contributed for this viewType."}
        </p>
      </div>
    )
  } else {
    // Empty split column, deselected home, or unplugged deep-link: New Tab.
    // Never render Next route "extension unavailable" alerts here.
    content = <NewTabWelcome />
  }

  return (
    <div
      data-testid={`editor-pane-${groupId}`}
      data-focused={focused ? "true" : undefined}
      className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col"
      onMouseDown={() => focusGroup(groupId)}
    >
      <TabStrip
        groupId={groupId}
        tabs={tabs}
        activeTabId={activeTabId}
        focused={focused}
      />
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {content}
      </div>
    </div>
  )
}

/**
 * Editor group: one or two side-by-side panes (horizontal split). When split,
 * a drag handle resizes the columns. Drag a tab to the far-right tab-strip
 * edge to open the right pane (Cursor-style).
 */
export function EditorGroup({ children }: { children: React.ReactNode }) {
  const { splitOpen } = useWorkbench()
  const [draggingTabId, setDraggingTabId] = React.useState<string | null>(null)
  const dragValue = React.useMemo(
    () => ({ draggingTabId, setDraggingTabId }),
    [draggingTabId]
  )
  // Next.js still renders deep-link `children` for routing; panes never show
  // those bodies (New Tab / extension editors only).
  void children

  return (
    <TabDragContext.Provider value={dragValue}>
      <section
        aria-label="Editor group"
        data-region="editor-group"
        className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col"
      >
        {splitOpen ? (
          <ResizablePanelGroup
            orientation="horizontal"
            className="h-full min-h-0 flex-1"
            data-testid="editor-split-group"
          >
            <ResizablePanel
              id="editor-primary"
              defaultSize="50%"
              minSize="20%"
              className="min-h-0 min-w-0"
            >
              <EditorPane groupId="primary" />
            </ResizablePanel>
            <ResizableHandle withHandle data-testid="editor-split-divider" />
            <ResizablePanel
              id="editor-secondary"
              defaultSize="50%"
              minSize="20%"
              className="min-h-0 min-w-0"
            >
              <EditorPane groupId="secondary" />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex h-full min-h-0 w-full min-w-0 flex-1">
            <EditorPane groupId="primary" />
          </div>
        )}
      </section>
    </TabDragContext.Provider>
  )
}

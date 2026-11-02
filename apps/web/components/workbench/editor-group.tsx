"use client"

import { XIcon } from "@phosphor-icons/react"

import { useWorkbench } from "@/components/workbench/workbench-context"
import { builtinEditors } from "@/lib/workbench/builtin-editors"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@starboard/lib-ui/components/empty"
import { cn } from "@starboard/lib-ui/lib/utils"

function EmptyEditor({ message }: { message: string }) {
  return (
    <Empty data-testid="empty-editor">
      <EmptyHeader>
        <EmptyTitle>No editor open</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function TabStrip() {
  const { tabs, activeTabId, focusTab, closeEditorTab } = useWorkbench()

  return (
    <div
      role="tablist"
      aria-label="Open editors"
      data-region="editor-tabs"
      className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b bg-muted/40"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            className={cn(
              "group flex max-w-56 items-center border-r text-sm",
              active ? "bg-background" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={active}
              title={`${tab.viewType}:${tab.resourceId}`}
              className="min-w-0 flex-1 truncate px-3 py-2 text-left"
              onClick={() => focusTab(tab.id)}
            >
              {tab.title}
            </button>
            <button
              type="button"
              aria-label={`Close ${tab.title}`}
              className="mr-1 rounded-sm p-1 opacity-60 hover:bg-muted hover:opacity-100"
              onClick={() => closeEditorTab(tab.id)}
            >
              <XIcon className="size-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Editor group: tab strip + content. Route-backed editors (compat shim) render
 * the Next route `children`; other viewTypes render a generic stub editor.
 */
export function EditorGroup({ children }: { children: React.ReactNode }) {
  const { tabs, activeTabId, contributions } = useWorkbench()
  const active = tabs.find((tab) => tab.id === activeTabId)
  const editor = active
    ? contributions.editors.find((e) => e.viewType === active.viewType)
    : undefined

  const Provided =
    editor && !editor.deepLink ? builtinEditors[editor.viewType] : undefined

  let content: React.ReactNode
  if (active && Provided) {
    content = <Provided resourceId={active.resourceId} title={active.title} />
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
  } else if (children) {
    content = children
  } else {
    content = (
      <EmptyEditor message="Editors appear here when an extension contributes a view type." />
    )
  }

  return (
    <section
      aria-label="Editor group"
      data-region="editor-group"
      className="flex min-w-0 flex-1 flex-col"
    >
      <TabStrip />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {content}
      </div>
    </section>
  )
}

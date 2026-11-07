"use client"

import { useEffect, useMemo, useState, useTransition } from "react"

import { useWorkbench } from "@/components/workbench/workbench-context"
import { StarboardMark } from "@/components/workbench/starboard-mark"
import { builtinNewTabCommands } from "@/lib/workbench/builtin-editors"
import type { WorkbenchNewTabAction } from "@/lib/workbench/types"
import { Button } from "@starboard/lib-ui/components/button"
import { Kbd, KbdGroup } from "@starboard/lib-ui/components/kbd"
import { toast } from "@starboard/lib-ui/components/toast"
import { cn } from "@starboard/lib-ui/lib/utils"

function isApplePlatform() {
  if (typeof navigator === "undefined") return false
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
}

function displayKey(token: string, isApple: boolean): string {
  const normalized = token.toLowerCase()
  if (normalized === "mod") return isApple ? "⌘" : "Ctrl"
  if (normalized === "shift") return isApple ? "⇧" : "Shift"
  if (normalized === "alt") return isApple ? "⌥" : "Alt"
  if (normalized === "ctrl" || normalized === "control") return "Ctrl"
  if (normalized === "meta" || normalized === "cmd")
    return isApple ? "⌘" : "Meta"
  return token.length === 1 ? token.toUpperCase() : token
}

function chordMatches(
  event: KeyboardEvent,
  keybinding: string[] | undefined,
  isApple: boolean
): boolean {
  if (!keybinding?.length) return false

  let wantMod = false
  let wantShift = false
  let wantAlt = false
  let wantCtrl = false
  let letter: string | null = null

  for (const raw of keybinding) {
    const token = raw.toLowerCase()
    if (token === "mod") wantMod = true
    else if (token === "shift") wantShift = true
    else if (token === "alt") wantAlt = true
    else if (token === "ctrl" || token === "control") wantCtrl = true
    else if (token === "meta" || token === "cmd") wantMod = true
    else letter = raw.length === 1 ? raw.toUpperCase() : raw
  }

  if (!letter || letter.length !== 1) return false

  const modPressed = isApple ? event.metaKey : event.ctrlKey
  if (wantMod !== modPressed) return false
  if (wantShift !== event.shiftKey) return false
  if (wantAlt !== event.altKey) return false
  if (wantCtrl && isApple && !event.ctrlKey) return false
  if (!wantMod && !wantCtrl && (event.metaKey || event.ctrlKey)) return false

  return event.code === `Key${letter}` || event.key.toUpperCase() === letter
}

function ShortcutKeys({ keys }: { keys: string[] }) {
  return (
    <KbdGroup className="ms-6 shrink-0 gap-1" aria-hidden>
      {keys.map((key) => (
        <Kbd
          key={key}
          className="h-5 min-w-5 rounded-md border border-border/70 bg-transparent px-1.5 font-sans text-[11px] font-normal text-muted-foreground"
        >
          {key}
        </Kbd>
      ))}
    </KbdGroup>
  )
}

type ResolvedAction = {
  contribution: WorkbenchNewTabAction
  keys: string[]
  run: () => void | Promise<void>
  pendingLabel?: string
}

/**
 * VS Code / Cursor–style New Tab. Actions come from `workbench.newTab`
 * contributions (e.g. `quoting.document`); handlers for `command` ids live in
 * `builtinNewTabCommands`. Local keydown until ticket 102 owns global bindings.
 */
export function NewTabWelcome() {
  const { openEditor, contributions } = useWorkbench()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [apple, setApple] = useState(false)

  useEffect(() => {
    setApple(isApplePlatform())
  }, [])

  const actions = useMemo(() => {
    const list: ResolvedAction[] = []

    for (const contribution of contributions.newTab) {
      const keys = (contribution.keybinding ?? []).map((token) =>
        displayKey(token, apple)
      )

      if (contribution.opens) {
        const opens = contribution.opens
        list.push({
          contribution,
          keys,
          run: () => openEditor(opens),
        })
        continue
      }

      if (contribution.command) {
        const handler = builtinNewTabCommands[contribution.command]
        if (!handler) continue
        const id = contribution.id
        list.push({
          contribution,
          keys,
          pendingLabel:
            contribution.command === "quoting.document.newQuote"
              ? "Creating..."
              : undefined,
          run: () => {
            setPendingId(id)
            startTransition(async () => {
              try {
                await handler({ openEditor })
              } catch (error) {
                toast.add({
                  type: "error",
                  title: "Action failed",
                  description:
                    error instanceof Error
                      ? error.message
                      : "Something went wrong. Try again.",
                })
              } finally {
                setPendingId(null)
              }
            })
          },
        })
      }
    }

    return list
  }, [apple, contributions.newTab, openEditor, startTransition])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return
      }

      const action = actions.find((item) =>
        chordMatches(event, item.contribution.keybinding, apple)
      )
      if (!action) return
      event.preventDefault()
      void action.run()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [actions, apple])

  return (
    <div
      data-testid="new-tab-welcome"
      className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center px-6 py-16"
    >
      <StarboardMark className="mb-10 size-20" />
      {actions.length > 0 ? (
        <ul className="flex w-full max-w-sm flex-col gap-0.5">
          {actions.map((action) => {
            const busy = pending && pendingId === action.contribution.id
            return (
              <li key={action.contribution.id}>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void action.run()}
                  aria-keyshortcuts={
                    action.keys.length > 0 ? action.keys.join("+") : undefined
                  }
                  className={cn(
                    "h-auto w-full justify-between gap-4 px-2 py-1.5 text-left text-sm font-normal text-muted-foreground",
                    "hover:text-foreground"
                  )}
                >
                  <span className="min-w-0 truncate">
                    {busy && action.pendingLabel
                      ? action.pendingLabel
                      : action.contribution.label}
                  </span>
                  {action.keys.length > 0 ? (
                    <ShortcutKeys keys={action.keys} />
                  ) : null}
                </Button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No extensions available for this organization.
        </p>
      )}
    </div>
  )
}

import { NewTabWelcome } from "@/components/workbench/new-tab-welcome"

/**
 * Deep-link route body when the matching editor is not mounted in this pane
 * (empty split column, or extension unplugged). Always the New Tab welcome —
 * never surface "extension not active" errors to users.
 */
export function EditorRouteFallback() {
  return <NewTabWelcome />
}

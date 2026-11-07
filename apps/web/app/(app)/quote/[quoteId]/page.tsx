import { EditorRouteFallback } from "@/components/workbench/editor-route-fallback"

/**
 * Deep-link anchor for `quote`. Active built-in → editor group mounts the quote
 * editor; empty / unplugged → New Tab welcome.
 */
export default function QuoteDeepLinkPage() {
  return <EditorRouteFallback />
}

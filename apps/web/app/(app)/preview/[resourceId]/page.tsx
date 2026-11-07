import { EditorRouteFallback } from "@/components/workbench/editor-route-fallback"

/**
 * Deep-link anchor for `quote.preview`. When the built-in is active the editor
 * group mounts the preview editor; otherwise (or in an empty split pane) show
 * New Tab — never an "extension unavailable" error.
 */
export default function QuotePreviewDeepLinkPage() {
  return <EditorRouteFallback />
}

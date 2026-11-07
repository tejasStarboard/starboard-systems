import { EditorRouteFallback } from "@/components/workbench/editor-route-fallback"

/** Deep-link anchor; editor UI mounts in the workbench when the extension is active. */
export default function EditorDeepLinkPage() {
  return <EditorRouteFallback />
}

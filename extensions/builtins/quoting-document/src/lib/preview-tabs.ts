import type { PreviewTab, SlotContribution } from "../slots/types"

/**
 * A `quoting.slots.preview` contribution targets a tab via manifest
 * `props: { tab }`; without it the contribution mounts on both tabs.
 */
export function contributesToPreviewTab(
  contribution: Pick<SlotContribution, "props">,
  tab: PreviewTab
): boolean {
  const target = contribution.props?.tab
  return target === undefined || target === tab
}

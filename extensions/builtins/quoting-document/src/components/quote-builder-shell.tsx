"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CaretDownIcon,
  EyeIcon,
} from "@phosphor-icons/react"

import { Button } from "@starboard/lib-ui/components/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@starboard/lib-ui/components/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@starboard/lib-ui/components/dropdown-menu"
import { Separator } from "@starboard/lib-ui/components/separator"
import { useElementWidth } from "@starboard/lib-ui/hooks/use-element-width"
import { cn } from "@starboard/lib-ui/lib/utils"

import { QuoteCommandsSlot } from "./quote-commands-slot"
import type { QuoteFormLayoutProps } from "./quote-form-layout-props"
import { QuoteLanesPanel } from "./quote-lanes-panel"
import { QuoteLifecycleSlot } from "./quote-lifecycle-slot"
import { QuoteStepContent } from "./quote-step-content"
import { QuoteStepper } from "./quote-stepper"
import {
  nextStep,
  previousStep,
  stepBlockedReason,
  type QuoteStepId,
} from "../lib/quote-builder-steps"
import { useQuoteSlotEntries } from "../slots/slot-host"
import { QUOTING_SLOTS } from "../slots/types"

/** Below this panel width, lanes move above the form (split-view friendly). */
const LANES_SIDEBAR_MIN_WIDTH = 880

function SaveActions({ props }: { props: QuoteFormLayoutProps }) {
  return (
    <ButtonGroup aria-label="Save quote">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={props.onCancel}
      >
        Cancel
      </Button>
      <ButtonGroupSeparator />
      <Button
        type="submit"
        size="sm"
        disabled={props.pending || !props.isDirty}
      >
        {props.pending ? "Saving..." : "Save"}
      </Button>
    </ButtonGroup>
  )
}

function StepNav({
  back,
  forward,
  forwardBlocked,
  onBack,
  onForward,
}: {
  back: QuoteStepId | null
  forward: QuoteStepId | null
  forwardBlocked: string | null
  onBack: () => void
  onForward: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <ButtonGroup aria-label="Step navigation">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!back}
          onClick={onBack}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back
        </Button>
        {forward ? (
          <>
            <ButtonGroupSeparator />
            <Button
              type="button"
              size="sm"
              disabled={forwardBlocked !== null}
              onClick={onForward}
            >
              Next
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </>
        ) : null}
      </ButtonGroup>
      {forwardBlocked ? (
        <p
          role="status"
          data-testid="quote-step-blocked"
          className="max-w-40 truncate text-xs text-muted-foreground"
          title={forwardBlocked}
        >
          {forwardBlocked}
        </p>
      ) : null}
    </div>
  )
}

/** Preview primary action + `quoting.commands` (Export PDF, …) in a split menu. */
function PreviewActions({ props }: { props: QuoteFormLayoutProps }) {
  const commandEntries = useQuoteSlotEntries(QUOTING_SLOTS.commands)
  const hasPreview = Boolean(props.onOpenPreview)
  const hasCommands = commandEntries.length > 0

  if (!hasPreview && !hasCommands) return null

  if (hasPreview && hasCommands) {
    return (
      <ButtonGroup aria-label="Preview and export">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="quote-open-preview"
          onClick={props.onOpenPreview}
        >
          <EyeIcon data-icon="inline-start" />
          Preview
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="More preview actions"
                data-testid="quote-preview-actions"
              />
            }
          >
            <CaretDownIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-44">
            <QuoteCommandsSlot props={props} />
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
    )
  }

  if (hasPreview) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="quote-open-preview"
        onClick={props.onOpenPreview}
      >
        <EyeIcon data-icon="inline-start" />
        Preview
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Quote actions"
            data-testid="quote-preview-actions"
          />
        }
      >
        Actions
        <CaretDownIcon data-icon="inline-end" className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <QuoteCommandsSlot props={props} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Two-step quote builder: pick a lane, walk Route → Rate.
 * Lanes sit in a right sidebar when the editor panel is wide enough; otherwise
 * they collapse to a top strip — driven by this container's width (not the
 * viewport), so workbench split panes behave correctly.
 */
export function QuoteBuilderShell({ props }: { props: QuoteFormLayoutProps }) {
  const locked = !props.commercialEditable
  const [laneSteps, setLaneSteps] = useState<Record<string, QuoteStepId>>({})
  const { ref: shellRef, width: shellWidth } = useElementWidth()
  // Until measured, prefer sidebar (full editor). Narrow panels reflow after
  // the first ResizeObserver callback.
  const lanesOnTop = shellWidth > 0 && shellWidth < LANES_SIDEBAR_MIN_WIDTH

  // Terminal stages are read-only, not gated: every step stays viewable.
  const blockedReason = (target: QuoteStepId) =>
    locked ? null : stepBlockedReason(target, props.selectedLane)

  const storedStep: QuoteStepId =
    (props.selectedLaneId ? laneSteps[props.selectedLaneId] : undefined) ??
    "route"
  const step: QuoteStepId = blockedReason(storedStep) ? "route" : storedStep

  // Persist the clamp: otherwise fixing cargo again would snap this lane
  // back to its old Rate step.
  const selectedLaneId = props.selectedLaneId
  useEffect(() => {
    if (!selectedLaneId) return
    setLaneSteps((prev) =>
      prev[selectedLaneId] && prev[selectedLaneId] !== step
        ? { ...prev, [selectedLaneId]: step }
        : prev
    )
  }, [selectedLaneId, step])

  function goTo(target: QuoteStepId) {
    if (blockedReason(target)) return
    if (props.selectedLaneId) {
      const laneId = props.selectedLaneId
      setLaneSteps((prev) => ({ ...prev, [laneId]: target }))
    }
  }

  const back = previousStep(step)
  const forward = nextStep(step)
  const forwardBlocked = forward ? blockedReason(forward) : null

  const lanesPanel = (
    <QuoteLanesPanel
      variant={lanesOnTop ? "strip" : "sidebar"}
      laneFields={props.laneFields}
      lanes={props.lanes}
      selectedLaneIndex={props.selectedLaneIndex}
      laneSteps={laneSteps}
      portOptions={props.portOptions}
      onSelectLane={props.onSelectLane}
      onAddLane={props.onAddLane}
      onRemoveLane={props.onRemoveLane}
      commercialEditable={props.commercialEditable}
    />
  )

  return (
    <div
      ref={shellRef}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4"
      data-lanes-layout={lanesOnTop ? "strip" : "sidebar"}
    >
      <div className="w-full min-w-0 border-b pb-2">
        <QuoteLifecycleSlot props={props} className="w-full min-w-0" />
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 gap-0",
          lanesOnTop ? "flex-col" : "flex-row"
        )}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 pr-1">
          {lanesOnTop ? lanesPanel : null}
          <div className="flex items-center justify-between gap-2">
            <QuoteStepper
              current={step}
              blockedReason={blockedReason}
              onSelect={goTo}
            />
            <StepNav
              back={back}
              forward={forward}
              forwardBlocked={forwardBlocked}
              onBack={() => back && goTo(back)}
              onForward={() => forward && goTo(forward)}
            />
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto pr-1",
              locked && "pointer-events-none opacity-60"
            )}
            aria-disabled={locked || undefined}
          >
            <QuoteStepContent step={step} props={props} />
          </div>
        </div>

        {!lanesOnTop ? lanesPanel : null}
      </div>

      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PreviewActions props={props} />
        <SaveActions props={props} />
      </div>
    </div>
  )
}

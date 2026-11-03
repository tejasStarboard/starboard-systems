"use client"

import { useEffect, useState } from "react"
import { ArrowLeftIcon, ArrowRightIcon, EyeIcon } from "@phosphor-icons/react"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@starboard/lib-ui/components/sheet"
import { Separator } from "@starboard/lib-ui/components/separator"
import { cn } from "@starboard/lib-ui/lib/utils"

import { QuoteCommandsSlot } from "./quote-commands-slot"
import type { QuoteFormLayoutProps } from "./quote-form-layout-props"
import { QuoteLanesPanel } from "./quote-lanes-panel"
import { QuoteLifecycleSlot } from "./quote-lifecycle-slot"
import { QuotePreviewPane } from "./quote-preview-pane"
import { QuoteStepContent } from "./quote-step-content"
import { QuoteStepper } from "./quote-stepper"
import {
  isLaneStep,
  nextStep,
  previousStep,
  stepBlockedReason,
  type LaneStepId,
  type QuoteStepId,
} from "../lib/quote-builder-steps"

export type QuoteBuilderLayout = "desktop" | "tablet" | "mobile"

function SaveActions({
  props,
  fullWidth,
}: {
  props: QuoteFormLayoutProps
  fullWidth?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2", fullWidth && "w-full")}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(fullWidth && "flex-1")}
        onClick={props.onCancel}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        size="sm"
        className={cn(fullWidth && "flex-1")}
        disabled={props.pending || !props.isDirty}
      >
        {props.pending ? "Saving..." : "Save"}
      </Button>
    </div>
  )
}

/**
 * Multistep quote builder chrome (ticket 089), shared by desktop / tablet /
 * mobile. Top: lifecycle + commands + Save, stepper. Steps 2–5 show the lane
 * strip and remember a step per lane; step 1 is quote-level. Desktop pins a
 * Preview pane beside the step; smaller screens open it in a bottom sheet.
 */
export function QuoteBuilderShell({
  props,
  layout,
}: {
  props: QuoteFormLayoutProps
  layout: QuoteBuilderLayout
}) {
  const locked = !props.commercialEditable
  const [view, setView] = useState<"basics" | "lane">("basics")
  const [laneSteps, setLaneSteps] = useState<Record<string, LaneStepId>>({})
  const [previewOpen, setPreviewOpen] = useState(false)

  // Terminal stages are read-only, not gated: every step stays viewable.
  const blockedReason = (target: QuoteStepId) =>
    locked ? null : stepBlockedReason(target, props.selectedLane)

  const storedLaneStep: LaneStepId =
    (props.selectedLaneId ? laneSteps[props.selectedLaneId] : undefined) ??
    "route"
  const laneStep: LaneStepId = blockedReason(storedLaneStep)
    ? "route"
    : storedLaneStep
  const step: QuoteStepId = view === "basics" ? "basics" : laneStep

  // Persist the clamp: otherwise fixing the ports again would snap this lane
  // back to its old (e.g. Build) step.
  const selectedLaneId = props.selectedLaneId
  useEffect(() => {
    if (!selectedLaneId) return
    setLaneSteps((prev) =>
      prev[selectedLaneId] && prev[selectedLaneId] !== laneStep
        ? { ...prev, [selectedLaneId]: laneStep }
        : prev
    )
  }, [selectedLaneId, laneStep])

  function goTo(target: QuoteStepId) {
    if (blockedReason(target)) return
    if (!isLaneStep(target)) {
      setView("basics")
      return
    }
    setView("lane")
    if (props.selectedLaneId) {
      const laneId = props.selectedLaneId
      setLaneSteps((prev) => ({ ...prev, [laneId]: target }))
    }
  }

  const back = previousStep(step)
  const forward = nextStep(step)
  const forwardBlocked = forward ? blockedReason(forward) : null
  const isDesktop = layout === "desktop"

  const content = (
    <div
      className={cn(locked && "pointer-events-none opacity-60")}
      aria-disabled={locked || undefined}
    >
      <QuoteStepContent
        step={step}
        props={props}
        layout={layout}
        onStepChange={goTo}
      />
    </div>
  )

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-end justify-between gap-3 border-b pb-4",
          layout === "mobile" && "flex-col items-stretch"
        )}
      >
        <QuoteLifecycleSlot props={props} layout={layout} />
        <div className="flex flex-wrap items-end justify-end gap-3">
          <QuoteCommandsSlot props={props} />
          {layout !== "mobile" ? <SaveActions props={props} /> : null}
        </div>
      </div>

      <QuoteStepper
        current={step}
        blockedReason={blockedReason}
        onSelect={goTo}
      />

      {step !== "basics" ? (
        <QuoteLanesPanel
          variant="strip"
          laneFields={props.laneFields}
          lanes={props.lanes}
          selectedLaneIndex={props.selectedLaneIndex}
          onSelectLane={props.onSelectLane}
          onAddLane={props.onAddLane}
          onRemoveLane={props.onRemoveLane}
          commercialEditable={props.commercialEditable}
        />
      ) : null}

      <div className="flex min-h-0 flex-1 gap-6 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto pr-1">{content}</div>
        {isDesktop ? (
          <aside className="sticky top-0 w-[26rem] shrink-0 self-start overflow-y-auto border-l pl-6 xl:w-[30rem]">
            <QuotePreviewPane layoutProps={props} step={step} />
          </aside>
        ) : null}
      </div>

      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!back}
            onClick={() => back && goTo(back)}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back
          </Button>
          {forward ? (
            <Button
              type="button"
              size="sm"
              disabled={forwardBlocked !== null}
              onClick={() => goTo(forward)}
            >
              Next
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          ) : null}
          {forwardBlocked ? (
            <p
              role="status"
              data-testid="quote-step-blocked"
              className="text-xs text-muted-foreground"
            >
              {forwardBlocked}
            </p>
          ) : null}
        </div>
        {!isDesktop ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
          >
            <EyeIcon data-icon="inline-start" />
            Preview
          </Button>
        ) : null}
        {layout === "mobile" ? <SaveActions props={props} fullWidth /> : null}
      </div>

      {!isDesktop ? (
        <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] gap-0">
            <SheetHeader>
              <SheetTitle>Preview</SheetTitle>
              <SheetDescription>
                How this quote will read as a PDF or email.
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-0">
              <QuotePreviewPane layoutProps={props} step={step} hideHeading />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  )
}

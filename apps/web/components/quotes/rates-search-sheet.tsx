"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

export function RatesSearchSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Search rates</SheetTitle>
          <SheetDescription>
            Matched carrier rates for this lane will appear here.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 items-center justify-center px-4 pb-8">
          <p className="text-center text-xs text-muted-foreground">
            Coming soon
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

"use client"

import type * as React from "react"
import { cn } from "cn"

import { Spinner } from "@starboard/lib-ui/components/spinner"

function LoadingState({
  className,
  size = "default",
  children = "Loading…",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm" | "inline"
}) {
  return (
    <div
      data-slot="loading-state"
      role="status"
      aria-busy="true"
      className={cn(
        "flex items-center justify-center text-muted-foreground",
        size === "default" && "min-h-32 w-full flex-1 flex-col gap-2 p-6",
        size === "sm" && "min-h-24 w-full flex-col gap-2 p-4",
        size === "inline" && "w-full flex-row gap-1.5 py-3",
        className
      )}
      {...props}
    >
      <Spinner
        className={cn(
          size === "inline" ? "size-3.5" : "size-5",
          "text-muted-foreground"
        )}
      />
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  )
}

export { LoadingState }

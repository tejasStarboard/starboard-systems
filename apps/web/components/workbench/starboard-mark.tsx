import Image from "next/image"

import { cn } from "@starboard/lib-ui/lib/utils"

/** Starboard mark from `apps/web/public` (served at `/favicon.png`). */
export function StarboardMark({ className }: { className?: string }) {
  return (
    <Image
      src="/favicon.png"
      alt="Starboard"
      width={106}
      height={88}
      priority
      className={cn("h-auto w-20 object-contain opacity-90", className)}
    />
  )
}

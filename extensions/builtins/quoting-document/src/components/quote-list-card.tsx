"use client"

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import {
  CheckIcon,
  CopyIcon,
  DotsThreeVerticalIcon,
} from "@phosphor-icons/react"

import type { QuoteListItemView } from "@starboard/lib-contracts"
import { Badge } from "@starboard/lib-ui/components/badge"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@starboard/lib-ui/components/card"
import { Label } from "@starboard/lib-ui/components/label"
import { cn } from "@starboard/lib-ui/lib/utils"

import { QUOTE_STATUS_META } from "../lib/quote-stage"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@starboard/lib-ui/components/dropdown-menu"

interface QuoteListCardProps {
  quote: QuoteListItemView
  active?: boolean
  onOpen: (quote: QuoteListItemView) => void
}

const STATUS_META = QUOTE_STATUS_META

function formatTimeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`
}

function subjectFor(quote: QuoteListItemView): string {
  if (quote.customerName?.trim()) return quote.customerName.trim()
  return quote.source === "manual" ? "Manual quote" : "Untitled quote"
}

/**
 * Sidebar quote row — Outlook `StageQuoteCard` layout on shadcn Card/Button/Badge.
 */
export function QuoteListCard({
  quote,
  active = false,
  onOpen,
}: QuoteListCardProps) {
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const status = STATUS_META[quote.status]
  const subject = subjectFor(quote)
  const timeAgo = formatTimeAgo(quote.createdAt)
  const needsAttention = quote.status === "review"

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const open = () => onOpen(quote)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      open()
    }
  }

  const copyNumber = async (event: MouseEvent) => {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(quote.quoteId)
      setCopied(true)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopied(false), 1400)
    } catch {
      // Clipboard may be denied; leave UI unchanged.
    }
  }

  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      data-testid="quote-list-card"
      data-quote-id={quote.id}
      data-status={quote.status}
      onClick={open}
      onKeyDown={onKeyDown}
      className={cn(
        "cursor-pointer gap-1 py-2.5 transition-[box-shadow,background] hover:bg-muted/50",
        active && "bg-muted/60 ring-foreground/20",
        needsAttention && "border-l-[3px] border-l-destructive"
      )}
    >
      <CardHeader className="gap-0.5 px-3">
        <CardDescription className="flex min-w-0 items-center gap-1">
          <Label className="font-mono text-[11px] text-foreground/80">
            {quote.quoteId}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Copy quote number"
            title={copied ? "Copied!" : "Copy quote number"}
            className="size-5 text-muted-foreground"
            onClick={copyNumber}
          >
            {copied ? (
              <CheckIcon className="size-3 text-emerald-500" />
            ) : (
              <CopyIcon className="size-3" />
            )}
          </Button>
          <span aria-hidden>·</span>
          <span className="truncate text-[11px]">{timeAgo}</span>
        </CardDescription>
        <CardTitle className="truncate text-xs font-semibold" title={subject}>
          {subject}
        </CardTitle>

        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <DotsThreeVerticalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <CopyIcon className="size-3" />
                Copy quote number
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardFooter className="justify-between gap-2 border-0 px-3 py-0 pb-1.5">
        <Label className="min-w-0 truncate text-[11px] text-muted-foreground">
          {quote.ownerName}
        </Label>
        <Badge
          variant="outline"
          className="h-auto gap-1.5 border-0 px-0 py-0 font-normal"
        >
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ background: status.color }}
            aria-hidden
          />
          {status.label}
        </Badge>
      </CardFooter>
    </Card>
  )
}

"use client"

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"

import type { Rate } from "@starboard/lib-contracts"
import { Button } from "@starboard/lib-ui/components/button"
import {
  ButtonGroup,
  ButtonGroupText,
} from "@starboard/lib-ui/components/button-group"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@starboard/lib-ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@starboard/lib-ui/components/table"
import { toast } from "@starboard/lib-ui/components/toast"

import type { BuiltinHost } from "../host"
import {
  searchRatesTotalPages,
  type SearchRatesSort,
} from "../lib/search-rates-query"

function formatLane(rate: Rate): string {
  const origin = rate.origin ?? "—"
  const destination = rate.destination ?? "—"
  return `${origin} → ${destination}`
}

function formatValidity(rate: Rate): string {
  return `${rate.validFrom.slice(0, 10)} → ${rate.validTo.slice(0, 10)}`
}

function formatAmount(rate: Rate): string {
  return rate.amount.toLocaleString("en-US", {
    style: "currency",
    currency: rate.currencyCode,
  })
}

export function SearchRatesResults({
  rates,
  total,
  page,
  onPageChange,
  loading,
  hasSearched,
  sort,
  onSortChange,
  host,
}: {
  /** Current page slice only. */
  rates: Rate[]
  total: number
  page: number
  onPageChange: (page: number) => void
  loading: boolean
  hasSearched: boolean
  sort: SearchRatesSort
  onSortChange: (sort: SearchRatesSort) => void
  host: BuiltinHost
}) {
  const pages = searchRatesTotalPages(total)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">
          {hasSearched
            ? `${total} rate${total === 1 ? "" : "s"}`
            : "Run a search to see catalog rates"}
        </p>
        <ButtonGroup aria-label="Sort and export" className="ml-auto">
          <Select
            value={sort}
            onValueChange={(value) => {
              if (
                value === "lane" ||
                value === "carrier" ||
                value === "validity" ||
                value === "amount"
              ) {
                onSortChange(value)
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Sort results" className="w-36">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lane">Lane</SelectItem>
              <SelectItem value="carrier">Carrier</SelectItem>
              <SelectItem value="validity">Validity</SelectItem>
              <SelectItem value="amount">Rate</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled
            title="Coming soon"
            onClick={() =>
              toast.add({ type: "info", title: "Export coming soon" })
            }
          >
            Export
          </Button>
        </ButtonGroup>
      </div>

      {loading ? (
        <LoadingState size="sm">Searching rates…</LoadingState>
      ) : !hasSearched ? null : total === 0 ? (
        <p className="text-sm text-muted-foreground">No rates found.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lane</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Transit</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => {
                const active =
                  host.activeEditor?.viewType === "rate" &&
                  host.activeEditor.resourceId === rate.id
                return (
                  <TableRow
                    key={rate.id}
                    data-state={active ? "selected" : undefined}
                  >
                    <TableCell className="font-medium">
                      {formatLane(rate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rate.customerId ?? "—"}
                    </TableCell>
                    <TableCell>{rate.carrier ?? "—"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatValidity(rate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(rate)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          host.openEditor({
                            viewType: "rate",
                            resourceId: rate.id,
                            title: rate.label,
                          })
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="flex justify-center border-t pt-2">
            <ButtonGroup aria-label="Results pagination">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
                aria-label="Previous page"
              >
                <CaretLeftIcon className="size-4" />
                <span className="sr-only sm:not-sr-only">Prev</span>
              </Button>
              <ButtonGroupText className="min-w-16 justify-center text-muted-foreground">
                {page} / {pages}
              </ButtonGroupText>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || page >= pages}
                onClick={() => onPageChange(page + 1)}
                aria-label="Next page"
              >
                <span className="sr-only sm:not-sr-only">Next</span>
                <CaretRightIcon className="size-4" />
              </Button>
            </ButtonGroup>
          </div>
        </>
      )}
    </div>
  )
}

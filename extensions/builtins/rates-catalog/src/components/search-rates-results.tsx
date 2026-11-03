"use client"

import type { Rate } from "@starboard/lib-contracts"
import { Button } from "@starboard/lib-ui/components/button"
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
import type { SearchRatesSort } from "../lib/search-rates-query"

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
  loading,
  hasSearched,
  sort,
  onSortChange,
  host,
}: {
  rates: Rate[]
  loading: boolean
  hasSearched: boolean
  sort: SearchRatesSort
  onSortChange: (sort: SearchRatesSort) => void
  host: BuiltinHost
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">
          {hasSearched
            ? `${rates.length} rate${rates.length === 1 ? "" : "s"}`
            : "Run a search to see catalog rates"}
        </p>
        <div className="ml-auto flex items-center gap-2">
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
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Searching rates…</p>
      ) : !hasSearched ? null : rates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rates found.</p>
      ) : (
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
      )}
    </div>
  )
}

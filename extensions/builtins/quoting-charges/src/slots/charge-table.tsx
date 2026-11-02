"use client"

import { PlusIcon, TrashIcon } from "@phosphor-icons/react"

import type {
  ChargeTableSlotProps,
  SlotComponentProps,
} from "@starboard/ext-quoting-document/slots"
import { Button } from "@starboard/lib-ui/components/button"
import { Input } from "@starboard/lib-ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@starboard/lib-ui/components/table"

import { RateSurchargesEditor } from "../components/rate-surcharges-editor"

/**
 * `quoting.charges.table` → `quoting.slots.chargeTable`: manual rate rows with
 * per-rate surcharge editors (behavior moved verbatim from the quote lane
 * editor; QV2 grid parity is a later ticket).
 */
export function ChargeTable({
  control,
  register,
  lanePath,
  rateFields,
  currencyCode,
  excludedBuckets,
  onAppendRate,
  onRemoveRate,
}: SlotComponentProps<ChargeTableSlotProps>) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Manual rates</h3>
        <p className="text-xs text-muted-foreground">
          Build an invoice-style breakdown for this lane.
        </p>
      </div>

      <div className="space-y-3">
        {rateFields.length ? (
          rateFields.map((field, index) => (
            <div key={field.id} className="overflow-hidden rounded-none border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Charge</TableHead>
                    <TableHead className="w-40 text-right">Amount</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Input
                        placeholder="Rate label"
                        {...register(`${lanePath}.manualRates.${index}.label`)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        className="text-right tabular-nums"
                        {...register(
                          `${lanePath}.manualRates.${index}.amount`,
                          {
                            valueAsNumber: true,
                          }
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove charge"
                        onClick={() => onRemoveRate(index)}
                      >
                        <TrashIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <RateSurchargesEditor
                control={control}
                register={register}
                lanePath={lanePath}
                rateIndex={index}
                currencyCode={currencyCode}
                excludedBuckets={excludedBuckets}
              />
            </div>
          ))
        ) : (
          <div className="overflow-x-auto rounded-none border">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="h-16 text-center text-muted-foreground">
                    No charges yet.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onAppendRate()}
      >
        <PlusIcon data-icon="inline-start" />
        Add charge
      </Button>
    </div>
  )
}

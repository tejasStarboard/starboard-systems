"use client"

import { useEffect, useState } from "react"

import type {
  CustomerRecord,
  ListContactsResponse,
} from "@starboard/lib-contracts"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"

import { CustomerDetail } from "../components/customer-detail"
import type { BuiltinEditorProps } from "../host"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready"
      customer: CustomerRecord
      contacts: ListContactsResponse
    }

async function readJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as
    (T & { error?: string }) | null
}

/**
 * `customer` editor: loads the customer + first contacts page from the BFF
 * (`/api/customers/:id[/contacts]`) and mounts `CustomerDetail`. A missing
 * customer is a 404 → "Customer not found." (never an empty draft).
 */
export function CustomerEditor({ resourceId }: BuiltinEditorProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: "loading" })
    const id = encodeURIComponent(resourceId)

    async function load() {
      try {
        const [customerRes, contactsRes] = await Promise.all([
          fetch(`/api/customers/${id}`, { signal: controller.signal }),
          fetch(`/api/customers/${id}/contacts?page=1&pageSize=25`, {
            signal: controller.signal,
          }),
        ])
        const customer = await readJson<CustomerRecord>(customerRes)
        if (customerRes.status === 404) {
          setState({ status: "error", message: "Customer not found." })
          return
        }
        const contacts = await readJson<ListContactsResponse>(contactsRes)
        if (!customerRes.ok || !customer?.id) {
          setState({
            status: "error",
            message: customer?.error ?? "Unable to load customer.",
          })
          return
        }
        if (!contactsRes.ok || !contacts?.contacts) {
          setState({
            status: "error",
            message: contacts?.error ?? "Unable to load contacts.",
          })
          return
        }
        setState({ status: "ready", customer, contacts })
      } catch (error) {
        if (controller.signal.aborted) return
        setState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Unable to load customer.",
        })
      }
    }

    void load()
    return () => controller.abort()
  }, [resourceId])

  if (state.status === "loading") {
    return (
      <LoadingState data-testid="customer-editor-loading">
        Loading customer…
      </LoadingState>
    )
  }

  if (state.status === "error") {
    return (
      <p role="alert" className="p-4 text-sm text-destructive">
        {state.message}
      </p>
    )
  }

  return (
    <CustomerDetail
      key={resourceId}
      initialCustomer={state.customer}
      initialContacts={state.contacts}
    />
  )
}

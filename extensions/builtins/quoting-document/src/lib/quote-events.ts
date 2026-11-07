/**
 * Same-window pub/sub when a quote persists. The standalone `quote.preview`
 * tab listens and reloads editor-context so PDF/email match the saved form.
 * (Cross-tab BroadcastChannel can layer on later; SSE is unnecessary for
 * "refresh after save completes".)
 */

export const QUOTE_SAVED_EVENT = "starboard:quote-saved"

export type QuoteSavedDetail = {
  /** Persisted quote row UUID (`form.id`), not the short quote number. */
  quoteId: string
}

const bus: EventTarget =
  typeof window !== "undefined" ? window : new EventTarget()

export function emitQuoteSaved(quoteId: string) {
  const id = quoteId.trim()
  if (!id) return
  bus.dispatchEvent(
    new CustomEvent<QuoteSavedDetail>(QUOTE_SAVED_EVENT, {
      detail: { quoteId: id },
    })
  )
}

export function subscribeQuoteSaved(
  handler: (quoteId: string) => void
): () => void {
  const onEvent = (event: Event) => {
    const detail = (event as CustomEvent<QuoteSavedDetail>).detail
    const id = detail?.quoteId?.trim()
    if (id) handler(id)
  }

  bus.addEventListener(QUOTE_SAVED_EVENT, onEvent)
  return () => bus.removeEventListener(QUOTE_SAVED_EVENT, onEvent)
}

import { extensionApiPath } from "@/lib/extension-api-path"

export type ExtensionJobIds = {
  workflowId: string
  runId: string
}

export type EnqueueJobOptions = {
  extensionId: string
  path?: string
  body?: BodyInit | null
  headers?: HeadersInit
  signal?: AbortSignal
}

export type EnqueueJobResult =
  | { ok: true; job: ExtensionJobIds }
  | { ok: false; error: string; aborted?: boolean }

export async function enqueueExtensionJobRequest(
  options: EnqueueJobOptions
): Promise<EnqueueJobResult> {
  try {
    const response = await fetch(
      extensionApiPath(options.extensionId, options.path ?? "jobs"),
      {
        method: "POST",
        body: options.body,
        headers: options.headers,
        signal: options.signal,
      }
    )
    const payload = (await response.json().catch(() => null)) as {
      error?: string
      workflowId?: string
      runId?: string
    } | null
    if (!response.ok) {
      return {
        ok: false,
        error: payload?.error ?? "Something went wrong. Try again.",
      }
    }
    if (!payload?.workflowId || !payload.runId) {
      return { ok: false, error: "Unexpected response." }
    }
    return {
      ok: true,
      job: {
        workflowId: payload.workflowId,
        runId: payload.runId,
      },
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "Aborted", aborted: true }
    }
    return { ok: false, error: "Something went wrong. Try again." }
  }
}

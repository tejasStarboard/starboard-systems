import "server-only"

import { env } from "@/env"
import {
  createServiceOptions,
  parseJsonResponse,
  serviceFetch,
  ServiceClientError,
} from "@/lib/clients/http"

export type MessagingConnection = {
  organizationId: string
  status: string
  authUrl?: string | null
}

export type MessagingMessage = {
  id: string
  organizationId: string
  subject: string
  fromAddress: string
  bodyPreview: string
  quoteId?: string | null
}

export type EnqueueMessagingJobResult = {
  workflowId: string
  runId: string
}

export type SendMessageResult = {
  id: string
  status: string
}

export interface MessagingClient {
  getConnection(organizationId: string): Promise<MessagingConnection>
  startConnection(organizationId: string): Promise<MessagingConnection>
  completeConnection(
    organizationId: string,
    code?: string
  ): Promise<MessagingConnection>
  disconnect(organizationId: string): Promise<MessagingConnection>
  enqueueSync(
    organizationId: string,
    options?: { syncIntervalMinutes?: number }
  ): Promise<EnqueueMessagingJobResult>
  listMessages(organizationId: string): Promise<MessagingMessage[]>
  sendMail(input: {
    organizationId: string
    toAddress: string
    subject: string
    body: string
    quoteId?: string
  }): Promise<SendMessageResult>
}

class HttpMessagingClient implements MessagingClient {
  constructor(
    private readonly options: { baseUrl: string } = {
      baseUrl: env.MESSAGING_SERVICE_URL,
    }
  ) {}

  async getConnection(organizationId: string): Promise<MessagingConnection> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
    })
    const response = await serviceFetch(
      `/extensions/messaging.msgraph/connection?organizationId=${encodeURIComponent(organizationId)}`,
      { method: "GET" },
      options
    )
    return parseJsonResponse(response, "Failed to get messaging connection")
  }

  async startConnection(organizationId: string): Promise<MessagingConnection> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
    })
    const response = await serviceFetch(
      "/extensions/messaging.msgraph/connection",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      },
      options
    )
    return parseJsonResponse(response, "Failed to start messaging connection")
  }

  async completeConnection(
    organizationId: string,
    code = "stub"
  ): Promise<MessagingConnection> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
    })
    const response = await serviceFetch(
      "/extensions/messaging.msgraph/connection/callback",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, code }),
      },
      options
    )
    return parseJsonResponse(
      response,
      "Failed to complete messaging connection"
    )
  }

  async disconnect(organizationId: string): Promise<MessagingConnection> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
    })
    const response = await serviceFetch(
      `/extensions/messaging.msgraph/connection?organizationId=${encodeURIComponent(organizationId)}`,
      { method: "DELETE" },
      options
    )
    return parseJsonResponse(response, "Failed to disconnect messaging")
  }

  async enqueueSync(
    organizationId: string,
    enqueueOptions?: { syncIntervalMinutes?: number }
  ): Promise<EnqueueMessagingJobResult> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
    })
    const response = await serviceFetch(
      "/extensions/messaging.msgraph/jobs",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ...(typeof enqueueOptions?.syncIntervalMinutes === "number"
            ? { syncIntervalMinutes: enqueueOptions.syncIntervalMinutes }
            : {}),
        }),
      },
      options
    )
    const body = await parseJsonResponse<{
      workflowId?: string
      runId?: string
    }>(response, "Failed to enqueue messaging sync")
    if (!body.workflowId || !body.runId) {
      throw new ServiceClientError(
        "Failed to enqueue messaging sync: invalid response",
        502,
        options.requestId
      )
    }
    return { workflowId: body.workflowId, runId: body.runId }
  }

  async listMessages(organizationId: string): Promise<MessagingMessage[]> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId,
    })
    const response = await serviceFetch(
      `/extensions/messaging.msgraph/messages?organizationId=${encodeURIComponent(organizationId)}`,
      { method: "GET" },
      options
    )
    return parseJsonResponse(response, "Failed to list messaging messages")
  }

  async sendMail(input: {
    organizationId: string
    toAddress: string
    subject: string
    body: string
    quoteId?: string
  }): Promise<SendMessageResult> {
    const options = createServiceOptions({
      baseUrl: this.options.baseUrl,
      organizationId: input.organizationId,
    })
    const response = await serviceFetch(
      "/extensions/messaging.msgraph/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
      options
    )
    return parseJsonResponse(response, "Failed to send message")
  }
}

let messagingClient: MessagingClient = new HttpMessagingClient()

export function getMessagingClient(): MessagingClient {
  return messagingClient
}

export function setMessagingClient(client: MessagingClient) {
  messagingClient = client
}

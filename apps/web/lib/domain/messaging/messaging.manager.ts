import "server-only"

import {
  getMessagingClient,
  type EnqueueMessagingJobResult,
  type MessagingClient,
  type MessagingConnection,
  type MessagingMessage,
  type SendMessageResult,
} from "@/lib/domain/messaging/messaging.client"

export class MessagingManager {
  constructor(
    private readonly messagingClient: MessagingClient = getMessagingClient()
  ) {}

  getConnection(organizationId: string): Promise<MessagingConnection> {
    return this.messagingClient.getConnection(organizationId)
  }

  startConnection(organizationId: string): Promise<MessagingConnection> {
    return this.messagingClient.startConnection(organizationId)
  }

  completeConnection(
    organizationId: string,
    code?: string
  ): Promise<MessagingConnection> {
    return this.messagingClient.completeConnection(organizationId, code)
  }

  disconnect(organizationId: string): Promise<MessagingConnection> {
    return this.messagingClient.disconnect(organizationId)
  }

  enqueueSync(organizationId: string): Promise<EnqueueMessagingJobResult> {
    return this.messagingClient.enqueueSync(organizationId)
  }

  listMessages(organizationId: string): Promise<MessagingMessage[]> {
    return this.messagingClient.listMessages(organizationId)
  }

  sendMail(input: {
    organizationId: string
    toAddress: string
    subject: string
    body: string
    quoteId?: string
  }): Promise<SendMessageResult> {
    return this.messagingClient.sendMail(input)
  }
}

let messagingManager: MessagingManager = new MessagingManager()

export function getMessagingManager(): MessagingManager {
  return messagingManager
}

export function setMessagingManager(manager: MessagingManager) {
  messagingManager = manager
}

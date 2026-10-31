import "server-only"

import {
  getMessagingClient,
  type EnqueueMessagingJobResult,
  type MessagingClient,
  type MessagingConnection,
  type MessagingMessage,
  type SendMessageResult,
} from "@/lib/domain/messaging/messaging.client"
import { messagingJobSettingsFromResolved } from "@/lib/domain/platform/extension-settings-runtime"
import { getPlatformManager } from "@/lib/domain/platform/platform.manager"

const MESSAGING_MSGRAPH = "messaging.msgraph"

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

  async enqueueSync(
    organizationId: string
  ): Promise<EnqueueMessagingJobResult> {
    const resolved =
      await getPlatformManager().getExtensionSettings(MESSAGING_MSGRAPH)
    return this.messagingClient.enqueueSync(
      organizationId,
      messagingJobSettingsFromResolved(MESSAGING_MSGRAPH, resolved)
    )
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

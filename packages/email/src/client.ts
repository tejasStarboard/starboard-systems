import { Resend } from "resend"
import type { ReactElement } from "react"

export type EmailSender = {
  name: string
  address: string
}

export type SendEmailOptions = {
  to: string | string[]
  subject: string
  react: ReactElement
  from?: string
}

export function createResendClient(apiKey: string) {
  return new Resend(apiKey)
}

export function formatSender(sender: EmailSender) {
  return `${sender.name} <${sender.address}>`
}

export async function sendEmail(
  resend: Resend,
  sender: EmailSender,
  options: SendEmailOptions
) {
  const { data, error } = await resend.emails.send({
    from: options.from ?? formatSender(sender),
    to: options.to,
    subject: options.subject,
    react: options.react,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

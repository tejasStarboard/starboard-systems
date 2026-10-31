import {
  createResendClient,
  sendEmail as sendEmailBase,
  type EmailSender,
  type SendEmailOptions,
} from "@starboard/lib-email"

import { env } from "@/env"

export const resend = createResendClient(env.RESEND_API_KEY)

export const emailSender: EmailSender = {
  name: env.EMAIL_SENDER_NAME,
  address: env.EMAIL_SENDER_ADDRESS,
}

export async function sendEmail(
  options: Omit<SendEmailOptions, "from"> & { from?: string }
) {
  return sendEmailBase(resend, emailSender, options)
}

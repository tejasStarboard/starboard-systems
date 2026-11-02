import { z } from "zod"

export const sendMessageFormSchema = z.object({
  toAddress: z.string().trim().min(1, "Recipient is required"),
  subject: z.string().trim().min(1, "Subject is required"),
  body: z.string().trim().min(1, "Body is required"),
})

export type SendMessageFormValues = z.infer<typeof sendMessageFormSchema>

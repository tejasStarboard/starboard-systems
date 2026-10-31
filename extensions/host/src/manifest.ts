import { z } from "zod"

export const planSchema = z.enum(["credit", "enterprise"])
export type Plan = z.infer<typeof planSchema>

export const extensionNavContributionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
})

export const extensionJobContributionSchema = z.object({
  type: z.string().min(1),
  carrier: z.string().min(1).optional(),
})

export const extensionApiContributionSchema = z.object({
  pathPrefix: z.string().min(1),
})

export const extensionContributesSchema = z.object({
  nav: z.array(extensionNavContributionSchema).optional(),
  jobs: z.array(extensionJobContributionSchema).optional(),
  api: z.array(extensionApiContributionSchema).optional(),
  uiSlots: z.array(z.string().min(1)).optional(),
})

export const extensionWorkerSchema = z.object({
  kind: z.literal("python-temporal"),
  service: z.enum(["ingestion", "messaging", "spot"]),
  plugin: z.string().min(1),
})

export const extensionManifestSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  displayName: z.string().min(1),
  requiredPlan: z.array(planSchema).min(1),
  contributes: extensionContributesSchema,
  worker: extensionWorkerSchema.optional(),
  healthPath: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
})

export type ExtensionManifest = z.infer<typeof extensionManifestSchema>
export type ExtensionNavContribution = z.infer<
  typeof extensionNavContributionSchema
>
export type ExtensionContributes = z.infer<typeof extensionContributesSchema>

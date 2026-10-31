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

export const extensionSettingTypeSchema = z.enum([
  "boolean",
  "string",
  "number",
  "select",
  "secret",
])

export const extensionSettingOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
})

export const extensionSettingContributionSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1).optional(),
    type: extensionSettingTypeSchema,
    default: z
      .union([z.boolean(), z.string(), z.number(), z.null()])
      .optional(),
    options: z.array(extensionSettingOptionSchema).optional(),
    scope: z.literal("platform"),
    required: z.boolean().optional(),
  })
  .superRefine((setting, ctx) => {
    if (setting.type === "select") {
      if (!setting.options?.length) {
        ctx.addIssue({
          code: "custom",
          message: "select settings require options",
          path: ["options"],
        })
      }
    } else if (setting.options) {
      ctx.addIssue({
        code: "custom",
        message: "options are only valid for select settings",
        path: ["options"],
      })
    }

    if (setting.default === undefined || setting.default === null) {
      return
    }

    const message = settingValueMessage(
      setting.type,
      setting.default,
      setting.options
    )
    if (message) {
      ctx.addIssue({ code: "custom", message, path: ["default"] })
    }
  })

export const extensionContributesSchema = z.object({
  nav: z.array(extensionNavContributionSchema).optional(),
  jobs: z.array(extensionJobContributionSchema).optional(),
  api: z.array(extensionApiContributionSchema).optional(),
  uiSlots: z.array(z.string().min(1)).optional(),
  settings: z.array(extensionSettingContributionSchema).optional(),
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
export type ExtensionSettingType = z.infer<typeof extensionSettingTypeSchema>
export type ExtensionSettingContribution = z.infer<
  typeof extensionSettingContributionSchema
>

export function settingValueMessage(
  type: ExtensionSettingType,
  value: unknown,
  options?: Array<{ value: string }>
): string | null {
  if (type === "boolean") {
    return typeof value === "boolean" ? null : "Expected a boolean"
  }
  if (type === "number") {
    return typeof value === "number" && Number.isFinite(value)
      ? null
      : "Expected a number"
  }
  if (type === "string" || type === "secret") {
    return typeof value === "string" ? null : "Expected a string"
  }
  if (typeof value !== "string") {
    return "Expected a string"
  }
  if (!options?.some((option) => option.value === value)) {
    return "Value is not one of the select options"
  }
  return null
}

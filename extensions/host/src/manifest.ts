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

/** Kernel-owned point prefixes; extensions may contribute to them but never define them. */
export const KERNEL_POINT_PREFIXES = ["workbench.", "core."] as const

export function isKernelPointId(pointId: string): boolean {
  return KERNEL_POINT_PREFIXES.some((prefix) => pointId.startsWith(prefix))
}

/** `workbench.activity` — activity bar entry. */
export const extensionActivityContributionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().min(1).optional(),
})

/** View entry that opens a (non-route) editor tab instead of navigating. */
export const extensionViewEntryOpensSchema = z.object({
  viewType: z.string().min(1),
  resourceId: z.string().min(1),
  title: z.string().min(1).optional(),
})

/** `workbench.views` — sidebar view (link / open-editor entries) under an activity. */
export const extensionViewContributionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  activityId: z.string().min(1),
  entries: z
    .array(
      z
        .object({
          id: z.string().min(1),
          label: z.string().min(1),
          /** Navigate to a route (route-backed editors). */
          href: z.string().min(1).optional(),
          /** Open an editor tab directly (extension-provided editor). */
          opens: extensionViewEntryOpensSchema.optional(),
        })
        .refine((entry) => Boolean(entry.href) !== Boolean(entry.opens), {
          message: "view entry needs exactly one of href or opens",
        })
    )
    .optional(),
})

/** `workbench.editors` — center tab document type. */
export const extensionEditorContributionSchema = z.object({
  viewType: z.string().min(1),
  displayName: z.string().min(1),
  deepLink: z.string().min(1).optional(),
})

/** `workbench.commands` — action id + title (handler wiring is client-side, later). */
export const extensionCommandContributionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
})

/** Contribution into an extension-defined point (e.g. `quoting.slots.chargeTable`). */
export const extensionPointContributionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
})

/** `defines.extensionPoints` — points this extension owns; others contribute here. */
export const extensionPointDefinitionSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1).optional(),
})

export const extensionDefinesSchema = z.object({
  extensionPoints: z.array(extensionPointDefinitionSchema).optional(),
})

export const extensionContributesSchema = z.object({
  activity: z.array(extensionActivityContributionSchema).optional(),
  views: z.array(extensionViewContributionSchema).optional(),
  editors: z.array(extensionEditorContributionSchema).optional(),
  commands: z.array(extensionCommandContributionSchema).optional(),
  /** Keyed by extension-defined point id → contributions to that point. */
  points: z
    .record(z.string().min(1), z.array(extensionPointContributionSchema))
    .optional(),
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

export const extensionManifestSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    displayName: z.string().min(1),
    requiredPlan: z.array(planSchema).min(1),
    defines: extensionDefinesSchema.optional(),
    contributes: extensionContributesSchema,
    worker: extensionWorkerSchema.optional(),
    healthPath: z.string().min(1).optional(),
    enabled: z.boolean().optional(),
  })
  .superRefine((manifest, ctx) => {
    const seen = new Set<string>()
    manifest.defines?.extensionPoints?.forEach((point, index) => {
      if (isKernelPointId(point.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Extensions cannot define kernel point "${point.id}"`,
          path: ["defines", "extensionPoints", index, "id"],
        })
      }
      if (seen.has(point.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate defined point "${point.id}"`,
          path: ["defines", "extensionPoints", index, "id"],
        })
      }
      seen.add(point.id)
    })
    for (const pointId of Object.keys(manifest.contributes.points ?? {})) {
      if (isKernelPointId(pointId)) {
        ctx.addIssue({
          code: "custom",
          message: `Kernel point "${pointId}" uses its named contributes key, not contributes.points`,
          path: ["contributes", "points", pointId],
        })
      }
    }
  })

export type ExtensionManifest = z.infer<typeof extensionManifestSchema>
export type ExtensionNavContribution = z.infer<
  typeof extensionNavContributionSchema
>
export type ExtensionActivityContribution = z.infer<
  typeof extensionActivityContributionSchema
>
export type ExtensionViewContribution = z.infer<
  typeof extensionViewContributionSchema
>
export type ExtensionEditorContribution = z.infer<
  typeof extensionEditorContributionSchema
>
export type ExtensionCommandContribution = z.infer<
  typeof extensionCommandContributionSchema
>
export type ExtensionPointContribution = z.infer<
  typeof extensionPointContributionSchema
>
export type ExtensionPointDefinition = z.infer<
  typeof extensionPointDefinitionSchema
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

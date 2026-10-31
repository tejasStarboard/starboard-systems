import {
  primaryKey,
  pgTable,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core"

/** Staff-controlled extension rollout (shell-owned, public schema). */
export const extensionRollout = pgTable("extension_rollout", {
  extensionId: text("extension_id").primaryKey(),
  /** off | common | beta | on — missing row treated as on at read time. */
  mode: text("mode").notNull().default("on"),
  updatedByUserId: text("updated_by_user_id").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const extensionRolloutOrg = pgTable(
  "extension_rollout_org",
  {
    extensionId: text("extension_id")
      .notNull()
      .references(() => extensionRollout.extensionId, { onDelete: "cascade" }),
    organizationId: text("organization_id").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.extensionId, table.organizationId],
      name: "extension_rollout_org_pk",
    }),
    index("extension_rollout_org_org_idx").on(table.organizationId),
  ]
)

/** Shared beta org allowlist used when extension rollout mode is `common`. */
export const platformCommonBetaOrg = pgTable("platform_common_beta_org", {
  organizationId: text("organization_id").primaryKey(),
  updatedByUserId: text("updated_by_user_id").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

/** Minimal staff audit trail for later audit UI. */
export const platformAuditLog = pgTable(
  "platform_audit_log",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").notNull(),
    action: text("action").notNull(),
    organizationId: text("organization_id"),
    extensionId: text("extension_id"),
    detail: text("detail"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("platform_audit_log_actor_idx").on(table.actorUserId),
    index("platform_audit_log_created_idx").on(table.createdAt),
  ]
)

import {
  index,
  pgSchema,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

/** Messaging extension owns this Postgres schema (tokens + synced messages). */
export const messagingSchema = pgSchema("messaging")

export const messagingConnection = messagingSchema.table("connection", {
  organizationId: text("organization_id").primaryKey(),
  /** disconnected | connecting | connected */
  status: text("status").notNull().default("disconnected"),
  /** Fernet ciphertext only — never plaintext refresh tokens. */
  encryptedRefreshToken: text("encrypted_refresh_token"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const messagingMessage = messagingSchema.table(
  "message",
  {
    id: text("id").notNull(),
    organizationId: text("organization_id").notNull(),
    subject: text("subject").notNull().default(""),
    fromAddress: text("from_address").notNull().default(""),
    bodyPreview: text("body_preview").notNull().default(""),
    quoteId: text("quote_id"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.organizationId, table.id],
      name: "messaging_message_pk",
    }),
    index("messaging_message_org_idx").on(table.organizationId),
  ]
)

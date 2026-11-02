import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"

/** AES-256-GCM envelope stored in `platform.extension_setting.value`. */
export type SecretEnvelope = {
  v: 1
  alg: "A256GCM"
  iv: string
  tag: string
  ct: string
}

function keyBytes(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest()
}

export function isSecretEnvelope(value: unknown): value is SecretEnvelope {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    record.v === 1 &&
    record.alg === "A256GCM" &&
    typeof record.iv === "string" &&
    typeof record.tag === "string" &&
    typeof record.ct === "string"
  )
}

export function encryptSecret(
  plaintext: string,
  secret: string
): SecretEnvelope {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", keyBytes(secret), iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  return {
    v: 1,
    alg: "A256GCM",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ct: ciphertext.toString("base64"),
  }
}

export function decryptSecret(
  envelope: SecretEnvelope,
  secret: string
): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    keyBytes(secret),
    Buffer.from(envelope.iv, "base64")
  )
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ct, "base64")),
    decipher.final(),
  ])
  return plaintext.toString("utf8")
}

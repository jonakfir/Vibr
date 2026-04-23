/**
 * Symmetric encryption for integration API keys (Stripe, Resend, etc).
 *
 * v1 strategy: AES-256-GCM with a server-side master key.
 *   env: DASHBOARD_SECRET_KEY = 32-byte key, base64-encoded.
 *
 * This lives server-side only; never import from client components.
 * Upgrade path: move the master key to a KMS (AWS KMS / GCP KMS / Vault)
 * and rotate per-company DEKs. The ciphertext format below is versioned so
 * we can decrypt old blobs after a rotation.
 */
import crypto from "node:crypto";

const VERSION = "v1";

function getMasterKey(): Buffer {
  const raw = process.env.DASHBOARD_SECRET_KEY;
  if (!raw) {
    throw new Error(
      "DASHBOARD_SECRET_KEY env var is missing — cannot encrypt integration secrets."
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("DASHBOARD_SECRET_KEY must be 32 bytes (base64-encoded).");
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(".");
}

export function decryptSecret(blob: string): string {
  const [version, ivB64, tagB64, ctB64] = blob.split(".");
  if (version !== VERSION) {
    throw new Error(`Unsupported ciphertext version: ${version}`);
  }
  const key = getMasterKey();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]);
  return pt.toString("utf8");
}

/** Fingerprint a secret for display ("sk_live_…a7f2") without revealing it. */
export function fingerprint(secret: string): string {
  if (secret.length <= 8) return "•".repeat(secret.length);
  return `${secret.slice(0, 7)}…${secret.slice(-4)}`;
}

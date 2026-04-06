import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("API_KEY_ENCRYPTION_SECRET environment variable is not set");
  }
  // Ensure the key is exactly 32 bytes for AES-256
  const key = Buffer.from(secret, "utf-8");
  if (key.length < 32) {
    // Pad with zeros if too short
    return Buffer.concat([key, Buffer.alloc(32 - key.length)]);
  }
  return key.subarray(0, 32);
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const key = getKey();
  const [ivHex, authTagHex, encryptedData] = encrypted.split(":");

  if (!ivHex || !authTagHex || !encryptedData) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

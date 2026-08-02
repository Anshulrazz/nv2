import crypto from "crypto";

/**
 * Normalizes a flag string (lowercasing, trimming extra whitespace)
 * and computes its SHA-256 hex digest.
 */
export function hashFlag(rawFlag: string): string {
  const normalized = rawFlag.trim().toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Compares a submitted flag string against a stored SHA-256 flagHash
 * using constant-time comparison to prevent timing attacks.
 */
export function verifyFlag(submittedFlag: string, storedFlagHash: string): boolean {
  const submittedHash = hashFlag(submittedFlag);
  const bufferSubmitted = Buffer.from(submittedHash, "hex");
  const bufferStored = Buffer.from(storedFlagHash, "hex");

  if (bufferSubmitted.length !== bufferStored.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferSubmitted, bufferStored);
}

import bcrypt from "bcryptjs";
import crypto from "crypto";

// ─── Constants ───────────────────────────────────────────────────────────────

const BCRYPT_SALT_ROUNDS = 10;

// ─── Password Hashing ────────────────────────────────────────────────────────

/**
 * Hash a plaintext password using bcrypt.
 * Uses the same salt rounds as the existing signup route.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

// ─── Reset Tokens ────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random password-reset token.
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * SHA-256 hash a reset token for safe database storage.
 */
export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

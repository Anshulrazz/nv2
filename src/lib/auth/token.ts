import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { RefreshToken } from "@/models/RefreshToken";
import type { Types } from "mongoose";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DeviceInfo {
  deviceId?: string;
  deviceName?: string;
  platform?: "ios" | "android" | "web";
}

export interface RefreshTokenRecord {
  rawToken: string;
  tokenHash: string;
}

// ─── Core Token Functions ────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure random refresh token (80 hex chars).
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

/**
 * SHA-256 hash a refresh token for storage.
 * Refresh tokens are high-entropy random strings, so a fast hash is
 * appropriate (unlike passwords which require bcrypt).
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─── Database Operations ─────────────────────────────────────────────────────

/**
 * Parse the JWT_REFRESH_EXPIRES env var into milliseconds.
 * Defaults to 30 days.
 */
function getRefreshExpiryMs(): number {
  const raw = process.env.JWT_REFRESH_EXPIRES || "30d";
  const match = raw.match(/^(\d+)(s|m|h|d)?$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // 30 days

  const value = parseInt(match[1], 10);
  const unit = match[2] || "s";

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] ?? 1000);
}

/**
 * Create a new refresh token record in the database.
 * Returns the raw (unhashed) token to send to the client.
 */
export async function createRefreshTokenRecord(
  userId: string | Types.ObjectId,
  deviceInfo: DeviceInfo,
  req: Request
): Promise<RefreshTokenRecord> {
  await connectToDatabase();

  const rawToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = new Date(Date.now() + getRefreshExpiryMs());

  // Extract IP and user agent from request headers
  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  await RefreshToken.create({
    userId,
    tokenHash,
    deviceId: deviceInfo.deviceId || undefined,
    deviceName: deviceInfo.deviceName || undefined,
    platform: deviceInfo.platform || undefined,
    ipAddress,
    userAgent,
    expiresAt,
  });

  return { rawToken, tokenHash };
}

/**
 * Rotate a refresh token: revoke the old one and create a new one.
 * Returns the new raw token for the client.
 */
export async function rotateRefreshToken(
  oldRawToken: string,
  userId: string | Types.ObjectId,
  deviceInfo: DeviceInfo,
  req: Request
): Promise<RefreshTokenRecord | null> {
  await connectToDatabase();

  const oldHash = hashRefreshToken(oldRawToken);

  // Find the existing token record
  const existing = await RefreshToken.findOne({
    tokenHash: oldHash,
    userId,
    revokedAt: null,
  });

  if (!existing) {
    return null;
  }

  // Check if expired
  if (existing.expiresAt < new Date()) {
    // Mark as revoked for audit trail
    existing.revokedAt = new Date();
    await existing.save();
    return null;
  }

  // Revoke the old token
  existing.revokedAt = new Date();
  await existing.save();

  // Carry forward device info from old token if not provided
  const mergedDeviceInfo: DeviceInfo = {
    deviceId: deviceInfo.deviceId || existing.deviceId || undefined,
    deviceName: deviceInfo.deviceName || existing.deviceName || undefined,
    platform: deviceInfo.platform || existing.platform || undefined,
  };

  // Create a new refresh token
  return createRefreshTokenRecord(userId, mergedDeviceInfo, req);
}

/**
 * Revoke a specific refresh token by its raw value.
 */
export async function revokeRefreshToken(rawToken: string): Promise<boolean> {
  await connectToDatabase();

  const tokenHash = hashRefreshToken(rawToken);
  const result = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { revokedAt: new Date() }
  );

  return result !== null;
}

/**
 * Revoke ALL refresh tokens for a given user (e.g., full logout).
 */
export async function revokeAllUserTokens(
  userId: string | Types.ObjectId
): Promise<number> {
  await connectToDatabase();

  const result = await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() }
  );

  return result.modifiedCount;
}

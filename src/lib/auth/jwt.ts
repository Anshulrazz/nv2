import jwt, { type SignOptions } from "jsonwebtoken";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Payload embedded inside every access token */
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/** Decoded token returned by `verifyAccessToken` */
export interface DecodedAccessToken extends JwtPayload {
  iat: number;
  exp: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET environment variable is not set");
  }
  return secret;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Sign a short-lived access token (default 15 min).
 * The expiry can be overridden via JWT_ACCESS_EXPIRES env var.
 */
export function generateAccessToken(payload: JwtPayload): string {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES || "15m";
  const options: SignOptions = { expiresIn: expiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, getAccessSecret(), options);
}

/**
 * Verify an access token and return the decoded payload.
 * Throws if the token is invalid, expired, or malformed.
 */
export function verifyAccessToken(token: string): DecodedAccessToken {
  return jwt.verify(token, getAccessSecret()) as DecodedAccessToken;
}

/**
 * Access token lifetime in seconds (used in API responses).
 * Parses the JWT_ACCESS_EXPIRES value; defaults to 900 (15 min).
 */
export function getAccessTokenExpirySeconds(): number {
  const raw = process.env.JWT_ACCESS_EXPIRES || "15m";

  const match = raw.match(/^(\d+)(s|m|h|d)?$/);
  if (!match) return 900;

  const value = parseInt(match[1], 10);
  const unit = match[2] || "s";

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return value * (multipliers[unit] ?? 1);
}

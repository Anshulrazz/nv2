import { NextResponse } from "next/server";
import { verifyAccessToken, type DecodedAccessToken } from "@/lib/auth/jwt";
import { formatErrorResponse } from "@/lib/auth/mobile-auth";

// ─── Types ───────────────────────────────────────────────────────────────────

/** The result of successful authentication — attached to handlers. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

// ─── Bearer Token Extraction ─────────────────────────────────────────────────

/**
 * Extract the bearer token from the Authorization header.
 * Returns null if the header is missing or malformed.
 */
function extractBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;

  // Must be "Bearer <token>"
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

// ─── Middleware Functions ────────────────────────────────────────────────────

/**
 * Attempt to authenticate the request.
 * Returns the decoded user payload if valid, or null if not.
 * Does NOT return an HTTP response — use `requireUser` for that.
 */
export function authenticate(req: Request): AuthenticatedUser | null {
  const token = extractBearerToken(req);
  if (!token) return null;

  try {
    const decoded: DecodedAccessToken = verifyAccessToken(token);
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/**
 * Require a valid authenticated user.
 * Returns the user payload on success, or a 401 NextResponse on failure.
 */
export function requireUser(
  req: Request
): AuthenticatedUser | NextResponse {
  const user = authenticate(req);
  if (!user) {
    return NextResponse.json(
      formatErrorResponse("Authentication required. Please provide a valid access token."),
      { status: 401 }
    );
  }
  return user;
}

/**
 * Require an authenticated admin user.
 * Returns the user payload on success, a 401 if not authenticated,
 * or a 403 if authenticated but not an admin.
 */
export function requireAdmin(
  req: Request
): AuthenticatedUser | NextResponse {
  const result = requireUser(req);

  // If it's a NextResponse, it means authentication failed — pass it through
  if (result instanceof NextResponse) {
    return result;
  }

  if (result.role !== "admin") {
    return NextResponse.json(
      formatErrorResponse("Forbidden. Admin access required."),
      { status: 403 }
    );
  }

  return result;
}

/**
 * Type guard to check if the result is an authenticated user (not an error response).
 */
export function isAuthenticated(
  result: AuthenticatedUser | NextResponse
): result is AuthenticatedUser {
  return !(result instanceof NextResponse);
}

import type { IUser } from "@/models/User";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MobileUserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string;
}

export interface MobileAuthResponse {
  success: true;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: MobileUserResponse;
}

export interface MobileErrorResponse {
  success: false;
  message: string;
  errors: string[];
}

export interface MobileSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

// ─── Formatters ──────────────────────────────────────────────────────────────

/**
 * Strip sensitive fields and format a user document for mobile responses.
 */
export function formatUserResponse(user: IUser): MobileUserResponse {
  return {
    id: String(user._id),
    name: user.name || "",
    email: user.email,
    role: user.role || "user",
    image: user.image || "",
  };
}

/**
 * Build the standard login/register response for mobile.
 */
export function formatAuthResponse(
  user: IUser,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): MobileAuthResponse {
  return {
    success: true,
    accessToken,
    refreshToken,
    expiresIn,
    user: formatUserResponse(user),
  };
}

/**
 * Build a standardised error response.
 */
export function formatErrorResponse(
  message: string,
  errors: string[] = []
): MobileErrorResponse {
  return {
    success: false,
    message,
    errors,
  };
}

/**
 * Build a standardised success response.
 */
export function formatSuccessResponse<T>(data: T): MobileSuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

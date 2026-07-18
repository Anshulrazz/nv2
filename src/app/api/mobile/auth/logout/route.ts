import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import {
  revokeRefreshToken,
  revokeAllUserTokens,
} from "@/lib/auth/token";
import {
  requireUser,
  isAuthenticated,
} from "@/lib/auth/middleware/auth";
import {
  formatErrorResponse,
  formatSuccessResponse,
} from "@/lib/auth/mobile-auth";

// ─── Validation ──────────────────────────────────────────────────────────────

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Authentication is optional for logout — but if a Bearer token is present,
    // we can use it to revoke all tokens for the user when no refreshToken is sent.
    const authResult = requireUser(req);

    const body = await req.json().catch(() => ({}));
    const parsed = logoutSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message);
      return NextResponse.json(
        formatErrorResponse("Validation failed.", errors),
        { status: 400 }
      );
    }

    const { refreshToken } = parsed.data;

    await connectToDatabase();

    if (refreshToken) {
      // Revoke the specific refresh token
      await revokeRefreshToken(refreshToken);
    } else if (isAuthenticated(authResult)) {
      // No refresh token provided but user is authenticated — revoke all sessions
      await revokeAllUserTokens(authResult.userId);
    } else {
      // Neither a refresh token nor valid access token was provided
      return NextResponse.json(
        formatErrorResponse("Provide a refresh token or a valid access token to log out."),
        { status: 400 }
      );
    }

    return NextResponse.json(
      formatSuccessResponse({ message: "Logged out successfully." }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Mobile logout error:", error);
    return NextResponse.json(
      formatErrorResponse("An unexpected error occurred during logout."),
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import {
  requireUser,
  isAuthenticated,
} from "@/lib/auth/middleware/auth";
import {
  formatUserResponse,
  formatErrorResponse,
  formatSuccessResponse,
} from "@/lib/auth/mobile-auth";

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    // Require valid access token
    const authResult = requireUser(req);
    if (!isAuthenticated(authResult)) {
      return authResult; // 401 response
    }

    await connectToDatabase();

    // Fetch fresh user data from database
    const user = await User.findById(authResult.userId).select(
      "-passwordHash -resetTokenHash -resetTokenExpiry"
    );

    if (!user) {
      return NextResponse.json(
        formatErrorResponse("User not found."),
        { status: 404 }
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        formatErrorResponse("Your account has been suspended."),
        { status: 403 }
      );
    }

    return NextResponse.json(
      formatSuccessResponse({ user: formatUserResponse(user) }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Mobile me error:", error);
    return NextResponse.json(
      formatErrorResponse("An unexpected error occurred."),
      { status: 500 }
    );
  }
}

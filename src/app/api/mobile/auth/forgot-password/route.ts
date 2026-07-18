import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { generateResetToken, hashResetToken } from "@/lib/auth/password";
import { formatErrorResponse, formatSuccessResponse } from "@/lib/auth/mobile-auth";

// ─── Validation ──────────────────────────────────────────────────────────────

const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
});

// ─── Constants ───────────────────────────────────────────────────────────────

/** Reset tokens expire after 1 hour */
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message);
      return NextResponse.json(
        formatErrorResponse("Validation failed.", errors),
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    const user = await User.findOne({ email: normalizedEmail });

    // Always return success to prevent email enumeration attacks,
    // even if the user doesn't exist.
    if (!user) {
      return NextResponse.json(
        formatSuccessResponse({
          message: "If an account with that email exists, a password reset link has been sent.",
        }),
        { status: 200 }
      );
    }

    // Generate a reset token and store its hash
    const rawResetToken = generateResetToken();
    const resetHash = hashResetToken(rawResetToken);

    user.resetTokenHash = resetHash;
    user.resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    await user.save();

    // ─── EMAIL INTEGRATION POINT ─────────────────────────────────────
    // TODO: Send the reset email with the raw token.
    // When an email service (Resend, SendGrid, etc.) is configured,
    // send an email with a link like:
    //   https://notexia.in/reset-password?token=${rawResetToken}
    //
    // For now, we log the token in development only.
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Password reset token for ${normalizedEmail}: ${rawResetToken}`);
    }
    // ────────────────────────────────────────────────────────────────

    return NextResponse.json(
      formatSuccessResponse({
        message: "If an account with that email exists, a password reset link has been sent.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Mobile forgot-password error:", error);
    return NextResponse.json(
      formatErrorResponse("An unexpected error occurred."),
      { status: 500 }
    );
  }
}

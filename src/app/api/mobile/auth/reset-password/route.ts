import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashResetToken } from "@/lib/auth/password";
import { hashPassword } from "@/lib/auth/password";
import { formatErrorResponse, formatSuccessResponse } from "@/lib/auth/mobile-auth";

// ─── Validation ──────────────────────────────────────────────────────────────

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message);
      return NextResponse.json(
        formatErrorResponse("Validation failed.", errors),
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    await connectToDatabase();

    // Hash the incoming token and find the matching user
    const tokenHash = hashResetToken(token);
    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpiry: { $gt: new Date() }, // Not expired
    });

    if (!user) {
      return NextResponse.json(
        formatErrorResponse("Invalid or expired reset token."),
        { status: 400 }
      );
    }

    // Update password and clear reset token fields
    user.passwordHash = await hashPassword(password);
    user.resetTokenHash = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return NextResponse.json(
      formatSuccessResponse({
        message: "Password has been reset successfully. Please log in with your new password.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Mobile reset-password error:", error);
    return NextResponse.json(
      formatErrorResponse("An unexpected error occurred."),
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashPassword, hashResetToken } from "@/lib/auth/password";
import { sendPasswordResetSuccessEmail } from "@/lib/email/nodemailer";

const resetPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  resetToken: z.string().min(1, "Reset token is required."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const { email, resetToken, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    const hashedToken = hashResetToken(resetToken);

    const user = await User.findOne({
      email: normalizedEmail,
      resetTokenHash: hashedToken,
      resetTokenExpiry: { $gt: new Date() }, // Token not expired
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired password reset session. Please restart the process." },
        { status: 400 }
      );
    }

    // Hash and store the new password
    user.passwordHash = await hashPassword(password);
    user.resetTokenHash = undefined;
    user.resetTokenExpiry = undefined;
    user.resetOtpHash = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    // Send confirmation email asynchronously
    sendPasswordResetSuccessEmail({
      to: user.email,
      name: user.name,
    }).catch((err) => console.error("[Password Reset Success Email Error]:", err));

    return NextResponse.json(
      {
        message: "Your password has been reset successfully. You can now sign in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[2FA Forgot Password - reset-password] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating your password." },
      { status: 500 }
    );
  }
}

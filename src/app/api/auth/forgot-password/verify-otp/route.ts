import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashOtp } from "@/lib/email/nodemailer";
import { generateResetToken, hashResetToken } from "@/lib/auth/password";

const verifyOtpSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  otp: z.string().regex(/^\d{6}$/, "Verification code must be a 6-digit number."),
});

const MAX_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes to complete new password setup

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.resetOtpHash || !user.resetOtpExpiry) {
      return NextResponse.json(
        { error: "No active verification request found. Please request a new code." },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > new Date(user.resetOtpExpiry)) {
      user.resetOtpHash = undefined;
      user.resetOtpExpiry = undefined;
      user.resetOtpAttempts = 0;
      await user.save();

      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Check brute-force attempts
    if ((user.resetOtpAttempts || 0) >= MAX_ATTEMPTS) {
      user.resetOtpHash = undefined;
      user.resetOtpExpiry = undefined;
      user.resetOtpAttempts = 0;
      await user.save();

      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new verification code." },
        { status: 429 }
      );
    }

    const hashedIncomingOtp = hashOtp(otp);

    if (hashedIncomingOtp !== user.resetOtpHash) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
      await user.save();

      const remaining = MAX_ATTEMPTS - user.resetOtpAttempts;
      return NextResponse.json(
        {
          error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : "Please request a new code."}`,
        },
        { status: 400 }
      );
    }

    // OTP matches! Generate temporary single-use reset authorization token
    const rawResetToken = generateResetToken();
    const hashedResetToken = hashResetToken(rawResetToken);

    user.resetTokenHash = hashedResetToken;
    user.resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    // Clear OTP fields so it cannot be reused
    user.resetOtpHash = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    return NextResponse.json(
      {
        message: "2FA Verification successful.",
        resetToken: rawResetToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[2FA Forgot Password - verify-otp] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while verifying the code." },
      { status: 500 }
    );
  }
}

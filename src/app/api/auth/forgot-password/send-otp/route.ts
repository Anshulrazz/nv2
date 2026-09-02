import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { generateNumericOtp, hashOtp, sendPasswordResetOtpEmail } from "@/lib/email/nodemailer";

const sendOtpSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
});

// OTP valid for 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid email address." },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address. Please check your email or sign up." },
        { status: 404 }
      );
    }

    // Rate limiting: Check if user already requested OTP within the last 50 seconds
    if (user.resetOtpExpiry) {
      const remainingTime = user.resetOtpExpiry.getTime() - Date.now();
      // If expiry is > (10m - 50s = 550,000ms), user requested within last 50s
      if (remainingTime > OTP_EXPIRY_MS - 50 * 1000) {
        const secondsToWait = Math.max(1, Math.ceil((remainingTime - (OTP_EXPIRY_MS - 60 * 1000)) / 1000));
        return NextResponse.json(
          { error: `Please wait ${secondsToWait}s before requesting another verification code.` },
          { status: 429 }
        );
      }
    }

    // Generate 6-digit numeric OTP
    const otp = generateNumericOtp(6);
    const hashedOtp = hashOtp(otp);

    user.resetOtpHash = hashedOtp;
    user.resetOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
    user.resetOtpAttempts = 0;
    await user.save();

    // Send 2FA email using Hostinger SMTP via Nodemailer
    const emailResult = await sendPasswordResetOtpEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    if (!emailResult.success) {
      console.error("[2FA Forgot Password] Failed to send email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send 2FA verification email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "A 6-digit 2FA verification code has been sent to your email.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[2FA Forgot Password - send-otp] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while sending the verification code." },
      { status: 500 }
    );
  }
}

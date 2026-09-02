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
    try {
      const { getTransporter } = await import("@/lib/email/nodemailer");
      const mailer = getTransporter();
      const resetUrl = `https://notexia.in/reset-password?token=${rawResetToken}&email=${encodeURIComponent(normalizedEmail)}`;
      const displayName = user.name ? user.name.split(" ")[0] : "Scholar";

      await mailer.sendMail({
        from: process.env.SMTP_FROM || '"Notexia Security" <noreply@support.notexia.cloud>',
        to: normalizedEmail,
        subject: "Reset your Notexia password",
        html: `
          <div style="background-color: #0A0806; color: #FAFAF8; padding: 40px 20px; font-family: sans-serif;">
            <div style="max-width: 500px; margin: 0 auto; background: #150F0B; border: 1px solid #2E2118; border-radius: 16px; padding: 32px;">
              <h2 style="color: #F5B429; margin-top: 0;">Password Reset Request</h2>
              <p>Hello ${displayName},</p>
              <p>We received a request to reset your Notexia password. Click the link below to set a new password:</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${resetUrl}" style="background: #F5B429; color: #0A0806; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              <p style="font-size: 12px; color: #8A8078;">This link will expire in 1 hour. If you did not make this request, please ignore this email.</p>
            </div>
          </div>
        `,
        text: `Hello ${displayName},\n\nWe received a request to reset your Notexia password. Use the link below:\n${resetUrl}\n\nThis link will expire in 1 hour.`,
      });
    } catch (emailErr) {
      console.error("[Mobile Forgot Password] Failed to send email:", emailErr);
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

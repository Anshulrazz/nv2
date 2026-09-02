import nodemailer from "nodemailer";
import crypto from "crypto";

// ─── Nodemailer Transporter Singleton ───────────────────────────────────────

let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST || "smtp.hostinger.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER || "noreply@support.notexia.cloud";
    const pass = process.env.SMTP_PASS || "Anshul@00555";

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return transporter;
}

// ─── Cryptographic OTP Utilities ───────────────────────────────────────────

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 */
export function generateNumericOtp(length = 6): string {
  const digits = "0123456789";
  let otp = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
}

/**
 * SHA-256 hash an OTP or reset token for safe database persistence.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

// ─── Branded Email Templates ───────────────────────────────────────────────

const EMAIL_FROM = process.env.SMTP_FROM || '"Notexia Security" <noreply@support.notexia.cloud>';

/**
 * Send a 2FA OTP email for password reset.
 */
export async function sendPasswordResetOtpEmail({
  to,
  name,
  otp,
}: {
  to: string;
  name?: string;
  otp: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const mailer = getTransporter();
    const displayName = name ? name.split(" ")[0] : "Scholar";

    // Split OTP into individual boxes for HTML styling
    const otpDigits = otp.split("");
    const otpBoxesHtml = otpDigits
      .map(
        (digit) =>
          `<td style="width: 44px; height: 52px; background: #1a120c; border: 1.5px solid #F5B429; border-radius: 10px; text-align: center; font-size: 26px; font-weight: 800; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #F5B429; letter-spacing: 0; line-height: 52px; margin: 0 4px; box-shadow: 0 0 15px rgba(245, 180, 41, 0.15);">${digit}</td>`
      )
      .join('<td style="width: 8px;"></td>');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notexia 2FA Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0806; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FAFAF8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0A0806; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background: #150F0B; border: 1px solid #2E2118; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center; background: radial-gradient(circle at top, rgba(245, 180, 41, 0.15) 0%, rgba(21, 15, 11, 0) 70%);">
              <div style="display: inline-block; padding: 10px 18px; background: #0A0806; border: 1px solid #3d2918; border-radius: 999px; margin-bottom: 20px;">
                <span style="font-size: 15px; font-weight: 700; color: #FAFAF8; letter-spacing: 0.5px;">⚡ NOTEXIA</span>
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #FAFAF8; letter-spacing: -0.5px;">
                2FA Password Reset Code
              </h1>
              <p style="margin: 0; font-size: 13px; color: #8A8078; line-height: 1.5;">
                Two-Factor Security Verification for your Notexia Account
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 36px 32px 36px;">
              <p style="font-size: 14px; color: #D5CFC9; line-height: 1.6; margin: 0 0 24px 0;">
                Hello <strong style="color: #FAFAF8;">${displayName}</strong>,
              </p>
              <p style="font-size: 14px; color: #8A8078; line-height: 1.6; margin: 0 0 28px 0;">
                We received a request to reset the password for your Notexia account (<span style="color: #F5B429; font-weight: 500;">${to}</span>). Use the 2FA verification code below to authorize this request:
              </p>

              <!-- OTP Display Box -->
              <div style="text-align: center; margin: 28px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                  <tr>
                    ${otpBoxesHtml}
                  </tr>
                </table>
              </div>

              <!-- Expiry Alert -->
              <div style="background: rgba(245, 180, 41, 0.08); border: 1px solid rgba(245, 180, 41, 0.25); border-radius: 12px; padding: 14px 18px; margin: 28px 0 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #FCD34D; font-weight: 500;">
                  ⏱️ This code is valid for <strong>10 minutes</strong> and can only be used once.
                </p>
              </div>

              <!-- Security Notice -->
              <div style="border-top: 1px solid #2E2118; padding-top: 20px; margin-top: 24px;">
                <p style="font-size: 12px; color: #6E655F; line-height: 1.6; margin: 0;">
                  🔒 <strong>Didn't request this code?</strong><br>
                  If you did not initiate this request, someone else may have entered your email address by mistake. Your account remains secure and no changes have been made. You can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0A0806; border-top: 1px solid #2E2118; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #6E655F;">
                Notexia — AI-Powered Intelligent Learning & Workspace
              </p>
              <p style="margin: 0; font-size: 11px; color: #4A433D;">
                This is an automated system email. Please do not reply directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
Notexia - 2FA Password Reset Code

Hello ${displayName},

We received a request to reset the password for your Notexia account (${to}).

Your 2FA Verification Code is: ${otp}

This code will expire in 10 minutes.

If you did not request this password reset, please ignore this email. Your account remains safe.

Best regards,
The Notexia Team
https://notexia.in
    `;

    const info = await mailer.sendMail({
      from: EMAIL_FROM,
      to,
      subject: `Your Notexia 2FA Verification Code: ${otp}`,
      text: textContent,
      html: htmlContent,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[Nodemailer Error] Failed to send password reset OTP:", error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}

/**
 * Send a notification email when password has been successfully reset.
 */
export async function sendPasswordResetSuccessEmail({
  to,
  name,
}: {
  to: string;
  name?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const mailer = getTransporter();
    const displayName = name ? name.split(" ")[0] : "Scholar";

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed Successfully</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0806; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FAFAF8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0A0806; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background: #150F0B; border: 1px solid #2E2118; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center; background: radial-gradient(circle at top, rgba(34, 197, 94, 0.15) 0%, rgba(21, 15, 11, 0) 70%);">
              <div style="display: inline-block; padding: 10px 18px; background: #0A0806; border: 1px solid #1c3b24; border-radius: 999px; margin-bottom: 20px;">
                <span style="font-size: 15px; font-weight: 700; color: #4ade80; letter-spacing: 0.5px;">✓ SECURITY ALERT</span>
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #FAFAF8; letter-spacing: -0.5px;">
                Password Changed
              </h1>
              <p style="margin: 0; font-size: 13px; color: #8A8078; line-height: 1.5;">
                Your Notexia account password has been updated
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 36px 32px 36px;">
              <p style="font-size: 14px; color: #D5CFC9; line-height: 1.6; margin: 0 0 18px 0;">
                Hello <strong style="color: #FAFAF8;">${displayName}</strong>,
              </p>
              <p style="font-size: 14px; color: #8A8078; line-height: 1.6; margin: 0 0 24px 0;">
                This email confirms that the password for your Notexia account (<span style="color: #FAFAF8; font-weight: 500;">${to}</span>) was successfully reset on <strong>${new Date().toUTCString()}</strong>.
              </p>

              <div style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #4ade80; font-weight: 500;">
                  🛡️ You can now sign in with your new password.
                </p>
              </div>

              <div style="border-top: 1px solid #2E2118; padding-top: 20px; margin-top: 24px;">
                <p style="font-size: 12px; color: #EF4444; line-height: 1.6; margin: 0;">
                  ⚠️ <strong>Didn't make this change?</strong><br>
                  If you did not make this change, please contact our support team immediately at <a href="mailto:noreply@support.notexia.cloud" style="color: #F5B429; text-decoration: underline;">noreply@support.notexia.cloud</a> to protect your account.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0A0806; border-top: 1px solid #2E2118; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #6E655F;">
                Notexia Security Services
              </p>
              <p style="margin: 0; font-size: 11px; color: #4A433D;">
                Automated security notification • support.notexia.cloud
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = await mailer.sendMail({
      from: EMAIL_FROM,
      to,
      subject: "Your Notexia password has been changed",
      html: htmlContent,
      text: `Hello ${displayName},\n\nYour Notexia password for ${to} was successfully reset on ${new Date().toUTCString()}.\n\nIf you did not make this change, please contact support immediately.`,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[Nodemailer Error] Failed to send password reset success email:", error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { RefreshToken } from "@/models/RefreshToken";
import { hashRefreshToken } from "@/lib/auth/token";
import { createRefreshTokenRecord, type DeviceInfo } from "@/lib/auth/token";
import { generateAccessToken, getAccessTokenExpirySeconds } from "@/lib/auth/jwt";
import { User } from "@/models/User";
import { formatErrorResponse } from "@/lib/auth/mobile-auth";

// ─── Validation ──────────────────────────────────────────────────────────────

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
});

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = refreshSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message);
      return NextResponse.json(
        formatErrorResponse("Validation failed.", errors),
        { status: 400 }
      );
    }

    const { refreshToken: rawToken, deviceId, deviceName, platform } = parsed.data;

    await connectToDatabase();

    // Hash the incoming token and look it up
    const tokenHash = hashRefreshToken(rawToken);
    const tokenRecord = await RefreshToken.findOne({ tokenHash });

    // Token not found
    if (!tokenRecord) {
      return NextResponse.json(
        formatErrorResponse("Invalid refresh token."),
        { status: 401 }
      );
    }

    // Token was already revoked — possible token reuse attack
    if (tokenRecord.revokedAt) {
      // Revoke ALL tokens for this user as a security measure
      await RefreshToken.updateMany(
        { userId: tokenRecord.userId, revokedAt: null },
        { revokedAt: new Date() }
      );
      return NextResponse.json(
        formatErrorResponse("Refresh token has been revoked. All sessions invalidated for security."),
        { status: 401 }
      );
    }

    // Token is expired
    if (tokenRecord.expiresAt < new Date()) {
      tokenRecord.revokedAt = new Date();
      await tokenRecord.save();
      return NextResponse.json(
        formatErrorResponse("Refresh token has expired. Please log in again."),
        { status: 401 }
      );
    }

    // Verify the user still exists and is active
    const user = await User.findById(tokenRecord.userId);
    if (!user || user.isSuspended) {
      tokenRecord.revokedAt = new Date();
      await tokenRecord.save();
      return NextResponse.json(
        formatErrorResponse("User account is unavailable."),
        { status: 401 }
      );
    }

    // ── Rotate: revoke old token, create new one ──

    tokenRecord.revokedAt = new Date();
    await tokenRecord.save();

    // Carry forward device info from old token if not provided
    const deviceInfo: DeviceInfo = {
      deviceId: deviceId || tokenRecord.deviceId || undefined,
      deviceName: deviceName || tokenRecord.deviceName || undefined,
      platform: platform || tokenRecord.platform || undefined,
    };

    const { rawToken: newRawToken } = await createRefreshTokenRecord(
      user._id,
      deviceInfo,
      req
    );

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role || "user",
    });

    const expiresIn = getAccessTokenExpirySeconds();

    return NextResponse.json(
      {
        success: true,
        accessToken,
        refreshToken: newRawToken,
        expiresIn,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Mobile token refresh error:", error);
    return NextResponse.json(
      formatErrorResponse("An unexpected error occurred during token refresh."),
      { status: 500 }
    );
  }
}

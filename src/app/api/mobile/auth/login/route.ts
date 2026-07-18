import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { generateAccessToken, getAccessTokenExpirySeconds } from "@/lib/auth/jwt";
import { createRefreshTokenRecord, type DeviceInfo } from "@/lib/auth/token";
import { formatAuthResponse, formatErrorResponse } from "@/lib/auth/mobile-auth";

// ─── Rate Limiting ───────────────────────────────────────────────────────────

/**
 * Simple in-memory rate limiter.
 * Production should replace this with Redis-backed rate limiting.
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

// Periodic cleanup to prevent memory leaks (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    if (now > entry.resetAt) {
      loginAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ─── Validation ──────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
});

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        formatErrorResponse("Too many login attempts. Please try again later."),
        { status: 429 }
      );
    }

    // Parse and validate body
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message);
      return NextResponse.json(
        formatErrorResponse("Validation failed.", errors),
        { status: 400 }
      );
    }

    const { email, password, deviceId, deviceName, platform } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        formatErrorResponse("Invalid email or password."),
        { status: 401 }
      );
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return NextResponse.json(
        formatErrorResponse("Your account has been suspended. Please contact support."),
        { status: 403 }
      );
    }

    // Ensure the user has a password (OAuth-only users cannot login via mobile credentials)
    if (!user.passwordHash) {
      return NextResponse.json(
        formatErrorResponse(
          "This account uses Google login. Please sign in with Google or set a password first."
        ),
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        formatErrorResponse("Invalid email or password."),
        { status: 401 }
      );
    }

    // Generate access token
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role || "user",
    });

    // Generate and store refresh token
    const deviceInfo: DeviceInfo = { deviceId, deviceName, platform };
    const { rawToken: refreshToken } = await createRefreshTokenRecord(
      user._id,
      deviceInfo,
      req
    );

    const expiresIn = getAccessTokenExpirySeconds();

    return NextResponse.json(
      formatAuthResponse(user, accessToken, refreshToken, expiresIn),
      { status: 200 }
    );
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      formatErrorResponse("An unexpected error occurred during login."),
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { generateAccessToken, getAccessTokenExpirySeconds } from "@/lib/auth/jwt";
import { createRefreshTokenRecord, type DeviceInfo } from "@/lib/auth/token";
import { formatAuthResponse, formatErrorResponse } from "@/lib/auth/mobile-auth";

// ─── Validation ──────────────────────────────────────────────────────────────

// Same validation rules as the existing signup route
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
});

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Parse and validate body
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message);
      return NextResponse.json(
        formatErrorResponse("Validation failed.", errors),
        { status: 400 }
      );
    }

    const { name, email, password, deviceId, deviceName, platform } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        formatErrorResponse("A user with this email address already exists."),
        { status: 409 }
      );
    }

    // Hash password (same approach as existing signup route)
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
    });

    // Generate access token
    const accessToken = generateAccessToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role || "user",
    });

    // Generate and store refresh token
    const deviceInfo: DeviceInfo = { deviceId, deviceName, platform };
    const { rawToken: refreshToken } = await createRefreshTokenRecord(
      newUser._id,
      deviceInfo,
      req
    );

    const expiresIn = getAccessTokenExpirySeconds();

    return NextResponse.json(
      formatAuthResponse(newUser, accessToken, refreshToken, expiresIn),
      { status: 201 }
    );
  } catch (error) {
    console.error("Mobile register error:", error);
    return NextResponse.json(
      formatErrorResponse("An unexpected error occurred during registration."),
      { status: 500 }
    );
  }
}

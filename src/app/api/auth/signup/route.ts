import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Please provide a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
  referralCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate inputs
    const validated = signupSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, referralCode } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verify referrer if referral code was provided
    let referrer = null;
    if (referralCode && referralCode.trim() !== "") {
      const searchCode = referralCode.trim().toUpperCase();
      referrer = await User.findOne({ referralCode: searchCode });
      if (!referrer) {
        return NextResponse.json(
          { error: "The provided referral code is invalid." },
          { status: 400 }
        );
      }
    }

    // Generate unique referral code for the new user
    let newReferralCode = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      newReferralCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const codeExists = await User.findOne({ referralCode: newReferralCode });
      if (!codeExists) {
        isUnique = true;
      }
      attempts++;
    }

    // Create user
    const newUser = await User.create({
      name,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      referralCode: newReferralCode,
      referredBy: referrer ? referrer._id : undefined,
      coins: referrer ? 100 : 0, // Welcome bonus of 100 coins if referred, otherwise 0
    });

    // Award coins to referrer if exists
    if (referrer) {
      await User.updateOne({ _id: referrer._id }, { $inc: { coins: 200 } });
    }

    return NextResponse.json(
      {
        message: "User registered successfully.",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          referralCode: newUser.referralCode,
          coins: newUser.coins,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}


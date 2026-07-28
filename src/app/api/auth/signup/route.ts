import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { CoinTransaction } from "@/models/CoinTransaction";
import { getOrCreateUserWallet, generateReferralCode } from "@/lib/wallet";
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
    }

    // Generate unique referral code for the new user
    let newReferralCode = generateReferralCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const codeExists = await User.findOne({ referralCode: newReferralCode });
      if (!codeExists) {
        isUnique = true;
      } else {
        newReferralCode = generateReferralCode();
      }
      attempts++;
    }

    const initialCoins = referrer ? 50 : 0; // Referee gets 50 coins

    // Create new user
    const newUser = await User.create({
      name,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      referralCode: newReferralCode,
      referredBy: referrer ? referrer._id : undefined,
      coins: initialCoins,
    });

    // Create wallet for new user
    const newUserWallet = await getOrCreateUserWallet(newUser._id);
    if (initialCoins > 0) {
      newUserWallet.balance = initialCoins;
      await newUserWallet.save();

      // Write ledger entry for referee
      await CoinTransaction.create({
        fromWalletAddress: null,
        toWalletAddress: newUserWallet.address,
        amount: 50,
        type: "referral_bonus",
        status: "completed",
        metadata: {
          referralCode: referrer?.referralCode,
          relatedUserId: referrer ? referrer._id.toString() : null,
          note: "Welcome referral bonus",
        },
      });
    }

    // Award referrer 100 coins if exists & write ledger
    if (referrer) {
      referrer.coins = (referrer.coins || 0) + 100;
      referrer.referralCount = (referrer.referralCount || 0) + 1;
      referrer.referralRewardsEarned = (referrer.referralRewardsEarned || 0) + 100;
      await referrer.save();

      const referrerWallet = await getOrCreateUserWallet(referrer._id);
      referrerWallet.balance = referrer.coins;
      await referrerWallet.save();

      await CoinTransaction.create({
        fromWalletAddress: null,
        toWalletAddress: referrerWallet.address,
        amount: 100,
        type: "referral_bonus",
        status: "completed",
        metadata: {
          referralCode: referrer.referralCode,
          relatedUserId: newUser._id.toString(),
          note: `Referral reward for inviting ${newUser.name || newUser.email}`,
        },
      });
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
          walletAddress: newUserWallet.address,
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

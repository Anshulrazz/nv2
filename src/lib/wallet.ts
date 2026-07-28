import crypto from "crypto";
import mongoose from "mongoose";
import { User, IUser } from "@/models/User";
import { Wallet, IWallet } from "@/models/Wallet";

/**
 * Generate a unique wallet address in format NTX-32HEX
 */
export function generateWalletAddress(): string {
  return `NTX-${crypto.randomBytes(16).toString("hex").toUpperCase()}`;
}

/**
 * Generate a unique referral code in format REF-XXXXXX
 */
export function generateReferralCode(): string {
  return `REF-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

/**
 * Get or create a wallet for a given user ID, ensuring uniqueness and sync.
 */
export async function getOrCreateUserWallet(
  userId: string | mongoose.Types.ObjectId,
  session?: mongoose.ClientSession
): Promise<IWallet> {
  let wallet = await Wallet.findOne({ userId }).session(session || null);
  if (!wallet) {
    let address = generateWalletAddress();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await Wallet.findOne({ address }).session(session || null);
      if (!existing) {
        isUnique = true;
      } else {
        address = generateWalletAddress();
      }
      attempts++;
    }

    const user = await User.findById(userId).session(session || null);
    const initialBalance = user?.coins || 0;

    const newWallet = new Wallet({
      userId,
      address,
      balance: initialBalance,
    });

    if (session) {
      await newWallet.save({ session });
    } else {
      await newWallet.save();
    }
    wallet = newWallet;
  }

  return wallet;
}

/**
 * Ensure user has a referralCode generated.
 */
export async function ensureUserReferralCode(
  user: IUser,
  session?: mongoose.ClientSession
): Promise<string> {
  if (user.referralCode) {
    return user.referralCode;
  }

  let code = generateReferralCode();
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const existing = await User.findOne({ referralCode: code }).session(session || null);
    if (!existing) {
      isUnique = true;
    } else {
      code = generateReferralCode();
    }
    attempts++;
  }

  user.referralCode = code;
  if (session) {
    await user.save({ session });
  } else {
    await user.save();
  }

  return code;
}

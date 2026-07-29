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

let isAutoBackfillCompleted = false;

/**
 * Get or create a wallet for ANY given user ID (new OR existing user).
 * Ensures robust ObjectId/String query matching, referral code generation, and E11000 duplicate handling.
 */
export async function getOrCreateUserWallet(
  userId: string | mongoose.Types.ObjectId,
  session?: mongoose.ClientSession
): Promise<IWallet> {
  const strId = userId ? userId.toString() : "";
  const isValidObj = mongoose.Types.ObjectId.isValid(strId);
  const objId = isValidObj ? new mongoose.Types.ObjectId(strId) : null;

  // Query wallet using both ObjectId and string matches to handle legacy documents
  const queryConditions: Array<Record<string, unknown>> = [{ userId: strId }];
  if (objId) {
    queryConditions.push({ userId: objId });
  }

  let wallet = await Wallet.findOne({ $or: queryConditions }).session(session || null);

  if (!wallet) {
    let address = generateWalletAddress();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 15) {
      const existing = await Wallet.findOne({ address }).session(session || null);
      if (!existing) {
        isUnique = true;
      } else {
        address = generateWalletAddress();
      }
      attempts++;
    }

    const user = objId
      ? await User.findById(objId).session(session || null)
      : await User.findOne({ _id: strId }).session(session || null);

    const initialBalance = user?.coins || 0;

    const newWallet = new Wallet({
      userId: user ? user._id : objId || strId,
      address,
      balance: initialBalance,
    });

    try {
      if (session) {
        await newWallet.save({ session });
      } else {
        await newWallet.save();
      }
      wallet = newWallet;
    } catch (saveError: unknown) {
      // If a race condition or E11000 duplicate key error occurs, re-fetch the wallet
      const existing = await Wallet.findOne({ $or: queryConditions }).session(session || null);
      if (existing) {
        wallet = existing;
      } else {
        throw saveError;
      }
    }

    // Auto-ensure referral code is generated for existing user if missing
    if (user && (!user.referralCode || user.referralCode.trim() === "")) {
      try {
        await ensureUserReferralCode(user, session);
      } catch (err) {
        console.warn("User referral code sync warning:", err);
      }
    }
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
  if (user.referralCode && user.referralCode.trim() !== "") {
    return user.referralCode;
  }

  let code = generateReferralCode();
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 15) {
    const existing = await User.findOne({ referralCode: code }).session(session || null);
    if (!existing) {
      isUnique = true;
    } else {
      code = generateReferralCode();
    }
    attempts++;
  }

  user.referralCode = code;
  try {
    if (session) {
      await user.save({ session });
    } else {
      await user.save();
    }
  } catch (err) {
    console.warn("Save referral code duplicate check fallback:", err);
  }

  return code;
}

/**
 * Automatically backfill wallets for all existing users in the database asynchronously.
 */
export async function autoEnsureAllUsersHaveWallets(): Promise<{ backfilled: number }> {
  if (isAutoBackfillCompleted) return { backfilled: 0 };
  isAutoBackfillCompleted = true;

  let backfilled = 0;
  try {
    const allUsers = await User.find({}).select("_id referralCode coins");
    for (const user of allUsers) {
      try {
        if (!user.referralCode) {
          await ensureUserReferralCode(user);
        }
        const existingWallet = await Wallet.findOne({
          $or: [{ userId: user._id.toString() }, { userId: user._id }],
        }).lean();

        if (!existingWallet) {
          await getOrCreateUserWallet(user._id);
          backfilled++;
        }
      } catch (userErr) {
        console.warn(`User ${user._id} backfill warning:`, userErr);
      }
    }
  } catch (err) {
    console.warn("Auto backfill user wallets warning:", err);
  }

  return { backfilled };
}

import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email: string;
  passwordHash?: string;
  image?: string;
  role: "user" | "teacher" | "admin";
  points: number;
  coins: number;
  creatorEarnings: number;
  payoutDetails?: {
    upiId?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  referralCode?: string;
  referredBy?: mongoose.Types.ObjectId;
  referralCount: number;
  referralRewardsEarned: number;
  isPremium: boolean;
  isPremiumUser: boolean;
  premiumSince?: Date | null;
  premiumPlan?: "monthly" | "yearly" | null;
  premiumExpiresAt?: Date | null;
  // changed by ravi - added subscription tracking fields
  subscriptionId?: string | null;       // e.g. sub_TT5Y1breIHPLTs
  razorpayPlanId?: string | null;       // e.g. plan_TT5V5vOaLSgVtl
  subscriptionStatus?: "active" | "halted" | "cancelled" | "pending" | null;
  bio?: string;
  bannerImage?: string;
  isSuspended: boolean;
  isPublic: boolean;
  directMessageWallpaper?: string;
  directMessageWallpapers?: Map<string, string>;
  // 2FA / Password-reset fields
  resetTokenHash?: string;
  resetTokenExpiry?: Date;
  resetOtpHash?: string;
  resetOtpExpiry?: Date;
  resetOtpAttempts?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    image: { type: String },
    role: { type: String, enum: ["user", "teacher", "admin"], default: "user" },
    points: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    creatorEarnings: { type: Number, default: 0, min: 0 },
    payoutDetails: {
      type: Schema.Types.Mixed,
      default: {},
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      default: () => `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },
    referralCount: { type: Number, default: 0 },
    referralRewardsEarned: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    isPremiumUser: { type: Boolean, default: false },
    premiumSince: { type: Date, default: null },
    premiumPlan: { type: String, enum: ["monthly", "yearly", null], default: null },
    premiumExpiresAt: { type: Date, default: null },
    // changed by ravi - added subscription fields to schema
    subscriptionId: { type: String, default: null, index: true },
    razorpayPlanId: { type: String, default: null },
    subscriptionStatus: { type: String, enum: ["active", "halted", "cancelled", "pending", null], default: null },
    bio: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    isSuspended: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
    directMessageWallpaper: { type: String, default: "" },
    directMessageWallpapers: { type: Map, of: String, default: {} },
    // 2FA Password reset fields
    resetTokenHash: { type: String },
    resetTokenExpiry: { type: Date },
    resetOtpHash: { type: String },
    resetOtpExpiry: { type: Date },
    resetOtpAttempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);


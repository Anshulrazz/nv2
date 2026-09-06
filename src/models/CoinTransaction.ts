import mongoose, { Schema, Document } from "mongoose";

export type TransactionType =
  | "referral_bonus"
  | "signup_bonus"
  | "transfer"
  | "premium_purchase"
  | "admin_adjustment"
  | "course_purchase"
  | "course_creator_payout"
  | "course_platform_fee"
  | "project_purchase"
  | "project_creator_payout"
  | "project_platform_fee"
  | "buy_coins"
  | "creator_withdrawal";

export type TransactionStatus = "completed" | "failed" | "pending";

export interface ICoinTransaction extends Document {
  fromWalletAddress: string | null;
  toWalletAddress: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const CoinTransactionSchema = new Schema<ICoinTransaction>(
  {
    fromWalletAddress: {
      type: String,
      default: null,
      index: true,
    },
    toWalletAddress: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: [
        "referral_bonus",
        "signup_bonus",
        "transfer",
        "premium_purchase",
        "admin_adjustment",
        "course_purchase",
        "course_creator_payout",
        "course_platform_fee",
        "project_purchase",
        "project_creator_payout",
        "project_platform_fee",
        "buy_coins",
        "creator_withdrawal",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["completed", "failed", "pending"],
      default: "completed",
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const CoinTransaction =
  mongoose.models.CoinTransaction ||
  mongoose.model<ICoinTransaction>("CoinTransaction", CoinTransactionSchema);

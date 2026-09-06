import mongoose, { Schema, Document, Model } from "mongoose";

export type WithdrawalStatus = "pending" | "approved" | "completed" | "rejected";
export type PayoutMethod = "upi" | "bank_transfer";

export interface IWithdrawalRequest extends Document {
  userId: mongoose.Types.ObjectId;
  userRole?: "user" | "teacher" | "admin";
  amount: number; // Coin amount requested
  amountINR: number; // Net payout in INR (amount / 10)
  payoutMethod: PayoutMethod;
  payoutDetails: {
    upiId?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  status: WithdrawalStatus;
  adminNote?: string;
  transactionRef?: string;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userRole: { type: String, enum: ["user", "teacher", "admin"], default: "user" },
    amount: { type: Number, required: true, min: 1 },
    amountINR: { type: Number, default: 0 },
    payoutMethod: { type: String, enum: ["upi", "bank_transfer"], required: true },
    payoutDetails: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "completed", "rejected"],
      default: "pending",
      index: true,
    },
    adminNote: { type: String, default: "" },
    transactionRef: { type: String, default: "" },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const WithdrawalRequest: Model<IWithdrawalRequest> =
  mongoose.models.WithdrawalRequest ||
  mongoose.model<IWithdrawalRequest>("WithdrawalRequest", WithdrawalRequestSchema);

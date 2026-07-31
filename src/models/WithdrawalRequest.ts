import mongoose, { Schema, Document, Model } from "mongoose";

export type WithdrawalStatus = "pending" | "approved" | "completed" | "rejected";
export type PayoutMethod = "upi" | "bank_transfer";

export interface IWithdrawalRequest extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  payoutMethod: PayoutMethod;
  payoutDetails: {
    upiId?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  status: WithdrawalStatus;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    payoutMethod: { type: String, enum: ["upi", "bank_transfer"], required: true },
    payoutDetails: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "completed", "rejected"],
      default: "pending",
      index: true,
    },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export const WithdrawalRequest: Model<IWithdrawalRequest> =
  mongoose.models.WithdrawalRequest ||
  mongoose.model<IWithdrawalRequest>("WithdrawalRequest", WithdrawalRequestSchema);

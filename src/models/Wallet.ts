import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  address: string;
  balance: number;
  walletPasswordHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    walletPasswordHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Wallet =
  mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", WalletSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentOrder extends Document {
  userId: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amountINR: number;
  coinsDelivered?: number;
  type: "buy_coins" | "subscription";
  plan?: "monthly" | "yearly" | null;
  status: "created" | "paid" | "failed";
  appliedCoupon?: string | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentOrderSchema = new Schema<IPaymentOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    amountINR: { type: Number, required: true, min: 0 },
    coinsDelivered: { type: Number, default: 0 },
    type: { type: String, enum: ["buy_coins", "subscription"], required: true },
    plan: { type: String, enum: ["monthly", "yearly", null], default: null },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    appliedCoupon: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

export const PaymentOrder =
  mongoose.models.PaymentOrder ||
  mongoose.model<IPaymentOrder>("PaymentOrder", PaymentOrderSchema);

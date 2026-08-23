import mongoose, { Schema, Document } from "mongoose";

// changed by ravi - added subscription fields to IPaymentOrder
export interface IPaymentOrder extends Document {
  userId: mongoose.Types.ObjectId;
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string; // changed by ravi: e.g. sub_TT5Y1breIHPLTs
  razorpayPlanId?: string;         // changed by ravi: e.g. plan_TT5V5vOaLSgVtl
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amountINR: number;
  coinsDelivered?: number;
  type: "buy_coins" | "subscription";
  plan?: "monthly" | "yearly" | null;
  status: "created" | "paid" | "failed" | "active" | "halted" | "cancelled";
  appliedCoupon?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// changed by ravi - updated PaymentOrderSchema for razorpay subscriptions with unique default
const PaymentOrderSchema = new Schema<IPaymentOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: () => `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    },
    razorpaySubscriptionId: { type: String, sparse: true, index: true }, // changed by ravi
    razorpayPlanId: { type: String, default: null },                     // changed by ravi
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    amountINR: { type: Number, required: true, min: 0 },
    coinsDelivered: { type: Number, default: 0 },
    type: { type: String, enum: ["buy_coins", "subscription"], required: true },
    plan: { type: String, enum: ["monthly", "yearly", null], default: null },
    status: { type: String, enum: ["created", "paid", "failed", "active", "halted", "cancelled"], default: "created" },
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

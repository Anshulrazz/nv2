import mongoose, { Schema, Document } from "mongoose";

export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  paymentStatus: "free" | "paid" | "pending";
  amountPaid: number;
  paymentMethod: "free" | "coins" | "razorpay";
  paymentOrderId?: mongoose.Types.ObjectId;
  registeredAt: Date;
  updatedAt: Date;
}

const EventRegistrationSchema = new Schema<IEventRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    paymentStatus: {
      type: String,
      enum: ["free", "paid", "pending"],
      default: "free",
    },
    amountPaid: { type: Number, default: 0, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["free", "coins", "razorpay"],
      default: "free",
    },
    paymentOrderId: { type: Schema.Types.ObjectId, ref: "PaymentOrder" },
    registeredAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Enforce one registration per user per event
EventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
EventRegistrationSchema.index({ eventId: 1, registeredAt: -1 });

export const EventRegistration =
  mongoose.models.EventRegistration ||
  mongoose.model<IEventRegistration>("EventRegistration", EventRegistrationSchema);

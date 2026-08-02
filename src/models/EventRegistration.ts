import mongoose, { Schema, Document } from "mongoose";

export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  displayName: string;
  username: string;
  paymentStatus: "not_required" | "pending" | "paid" | "failed";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  registeredAt: Date;
}

const EventRegistrationSchema = new Schema<IEventRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    displayName: { type: String, required: true, trim: true },
    username: { type: String, required: true, lowercase: true, trim: true },
    paymentStatus: {
      type: String,
      enum: ["not_required", "pending", "paid", "failed"],
      default: "not_required",
    },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    registeredAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// Enforce unique registration per user per event
EventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// Enforce unique username per event
EventRegistrationSchema.index({ eventId: 1, username: 1 }, { unique: true });

export const EventRegistration =
  mongoose.models.EventRegistration ||
  mongoose.model<IEventRegistration>("EventRegistration", EventRegistrationSchema);

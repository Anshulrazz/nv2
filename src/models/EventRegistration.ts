import mongoose, { Schema, Document } from "mongoose";

export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  codename: string;
  realName: string;
  teamId: mongoose.Types.ObjectId | null;
  paymentStatus: "not_required" | "pending" | "paid" | "failed" | "waitlisted";
  paymentRef: string | null;
  razorpayOrderId: string | null;
  isDisqualified: boolean;
  disqualifiedReason: string | null;
  disqualifiedAt: Date | null;
  acceptedCodeOfConduct: boolean;
  finalScore: number | null;
  finalRank: number | null;
  finalizedAt: Date | null;
  registeredAt: Date;
  updatedAt: Date;
}

const EventRegistrationSchema = new Schema<IEventRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    codename: { type: String, required: true, trim: true },
    realName: { type: String, required: true, trim: true },
    teamId: { type: Schema.Types.ObjectId, ref: "EventTeam", default: null },
    paymentStatus: {
      type: String,
      enum: ["not_required", "pending", "paid", "failed", "waitlisted"],
      default: "not_required",
      index: true,
    },
    paymentRef: { type: String, default: null },
    razorpayOrderId: { type: String, default: null },
    isDisqualified: { type: Boolean, default: false, index: true },
    disqualifiedReason: { type: String, default: null },
    disqualifiedAt: { type: Date, default: null },
    acceptedCodeOfConduct: { type: Boolean, default: false },
    finalScore: { type: Number, default: null },
    finalRank: { type: Number, default: null },
    finalizedAt: { type: Date, default: null },
    registeredAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

// Compound unique: one registration per user per event
EventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
// Compound unique: codename unique per event (case-insensitive handled at app level)
EventRegistrationSchema.index({ eventId: 1, codename: 1 }, { unique: true });

export const EventRegistration =
  mongoose.models.EventRegistration ||
  mongoose.model<IEventRegistration>("EventRegistration", EventRegistrationSchema);

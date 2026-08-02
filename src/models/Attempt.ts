import mongoose, { Schema, Document } from "mongoose";

export interface IAttempt extends Document {
  eventId: mongoose.Types.ObjectId;
  challengeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: "not_started" | "in_progress" | "solved" | "expired" | "locked";
  startedAt?: Date;
  solvedAt?: Date;
  timeTakenSeconds?: number;
  wrongAttemptCount: number;
  pointsAwarded: number;
  hintsUsed: number[];
}

const AttemptSchema = new Schema<IAttempt>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    challengeId: { type: Schema.Types.ObjectId, ref: "Challenge", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "solved", "expired", "locked"],
      default: "not_started",
      index: true,
    },
    startedAt: { type: Date, default: null },
    solvedAt: { type: Date, default: null },
    timeTakenSeconds: { type: Number, default: 0 },
    wrongAttemptCount: { type: Number, default: 0 },
    pointsAwarded: { type: Number, default: 0 },
    hintsUsed: { type: [Number], default: [] },
  },
  {
    timestamps: true,
  }
);

// Idempotent point awarding: Unique attempt per user per challenge per event
AttemptSchema.index({ eventId: 1, challengeId: 1, userId: 1 }, { unique: true });

export const Attempt = mongoose.models.Attempt || mongoose.model<IAttempt>("Attempt", AttemptSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IEventHintUnlock extends Document {
  hintId: mongoose.Types.ObjectId;
  challengeId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId | null;
  pointsDeducted: number;
  unlockedAt: Date;
}

const EventHintUnlockSchema = new Schema<IEventHintUnlock>(
  {
    hintId: { type: Schema.Types.ObjectId, ref: "EventHint", required: true, index: true },
    challengeId: {
      type: Schema.Types.ObjectId,
      ref: "EventChallenge",
      required: true,
      index: true,
    },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "EventTeam", default: null },
    pointsDeducted: { type: Number, default: 0 },
    unlockedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// Idempotent: one unlock record per user per hint
EventHintUnlockSchema.index({ hintId: 1, userId: 1 }, { unique: true });

export const EventHintUnlock =
  mongoose.models.EventHintUnlock ||
  mongoose.model<IEventHintUnlock>("EventHintUnlock", EventHintUnlockSchema);

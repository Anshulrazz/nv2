import mongoose, { Schema, Document } from "mongoose";

export interface IRun extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  currentSequenceIndex: number;
  status: "not_started" | "in_progress" | "completed";
  startedAt?: Date;
  completedAt?: Date;
  totalPoints: number;
  totalTimeSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

const RunSchema = new Schema<IRun>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    currentSequenceIndex: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
      index: true,
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    totalPoints: { type: Number, default: 0 },
    totalTimeSeconds: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Enforce unique run per user per event
RunSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const Run = mongoose.models.Run || mongoose.model<IRun>("Run", RunSchema);

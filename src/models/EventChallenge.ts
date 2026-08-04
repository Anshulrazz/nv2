import mongoose, { Schema, Document } from "mongoose";

export interface IEventChallenge extends Document {
  eventId: mongoose.Types.ObjectId;
  title: string;
  descriptionMarkdown: string;
  images: string[];
  attachmentUrl: string | null;
  category: string;
  points: number;
  // Dynamic scoring: if maxPoints set, score decays from maxPoints toward minPoints
  maxPoints: number | null;
  minPoints: number | null;
  solveDecayFactor: number; // 0–1: fraction points drop per solve; 0 = static
  difficulty: "easy" | "medium" | "hard";
  // Flag stored as SHA-256 hex — NEVER sent to client
  flagHash: string;
  // Sequential mode: unlock after this challenge is solved by the user/team
  unlockAfterChallengeId: mongoose.Types.ObjectId | null;
  // Scheduled mode: visible only after this time
  releaseAt: Date | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventChallengeSchema = new Schema<IEventChallenge>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    title: { type: String, required: true, trim: true },
    descriptionMarkdown: { type: String, default: "" },
    images: { type: [String], default: [] },
    attachmentUrl: { type: String, default: null },
    category: { type: String, default: "Misc", trim: true },
    points: { type: Number, required: true, min: 1, default: 100 },
    maxPoints: { type: Number, default: null },
    minPoints: { type: Number, default: null },
    solveDecayFactor: { type: Number, default: 0, min: 0, max: 1 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    // select: true so it IS fetched server-side but we manually strip it before returning to client
    flagHash: { type: String, required: true, select: true },
    unlockAfterChallengeId: {
      type: Schema.Types.ObjectId,
      ref: "EventChallenge",
      default: null,
    },
    releaseAt: { type: Date, default: null },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

EventChallengeSchema.index({ eventId: 1, order: 1 });
EventChallengeSchema.index({ eventId: 1, category: 1 });

export const EventChallenge =
  mongoose.models.EventChallenge ||
  mongoose.model<IEventChallenge>("EventChallenge", EventChallengeSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IChallengeHint {
  text: string;
  pointsPenalty: number;
}

export interface IChallenge extends Document {
  eventId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  flagHash: string; // Secret flag is NEVER sent to client. Stored only as SHA-256 hash.
  timeLimitSeconds: number;
  hints: IChallengeHint[];
  attachmentUrls?: string[];
  order: number;
  createdAt: Date;
}

const HintSchema = new Schema<IChallengeHint>(
  {
    text: { type: String, required: true },
    pointsPenalty: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const ChallengeSchema = new Schema<IChallenge>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "Misc", trim: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    points: { type: Number, required: true, min: 1, default: 100 },
    flagHash: { type: String, required: true, select: true }, // Verified server-side only
    timeLimitSeconds: { type: Number, default: 1800, min: 60 }, // Default 30 mins
    hints: { type: [HintSchema], default: [] },
    attachmentUrls: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ChallengeSchema.index({ eventId: 1, order: 1 });

export const Challenge = mongoose.models.Challenge || mongoose.model<IChallenge>("Challenge", ChallengeSchema);

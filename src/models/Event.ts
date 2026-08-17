import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  name: string;
  slug: string;
  description: string;
  type: "hackathon" | "ctf" | "workshop";
  isPaid: boolean;
  price: number;
  currency: string;
  registrationStart: Date;
  registrationEnd: Date;
  eventStart: Date;
  eventEnd: Date;
  rulesMarkdown: string;
  bannerUrl: string;
  status: "draft" | "published" | "live" | "ended" | "archived";
  challengeReleaseMode: "sequential" | "scheduled" | "all_at_once";
  scoreFreezeAt: Date | null;
  resultsRevealedAt: Date | null;
  capacity: number | null;
  codeOfConductUrl: string;
  // Prize & Rewards
  prizePool: number;
  prizes: Array<{ place: string; prize: string; amount?: number }>;
  isPrizeRevealed: boolean;
  prizeRevealedAt: Date | null;
  // Team settings (hackathon mode)
  teamMode: boolean;
  maxTeamSize: number;
  // Judging
  judgeIds: mongoose.Types.ObjectId[];
  // Host management
  createdBy: mongoose.Types.ObjectId;
  hostIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["hackathon", "ctf", "workshop"], required: true },
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR" },
    registrationStart: { type: Date, required: true },
    registrationEnd: { type: Date, required: true },
    eventStart: { type: Date, required: true },
    eventEnd: { type: Date, required: true },
    rulesMarkdown: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "published", "live", "ended", "archived"],
      default: "draft",
      index: true,
    },
    challengeReleaseMode: {
      type: String,
      enum: ["sequential", "scheduled", "all_at_once"],
      default: "all_at_once",
    },
    scoreFreezeAt: { type: Date, default: null },
    resultsRevealedAt: { type: Date, default: null },
    capacity: { type: Number, default: null },
    codeOfConductUrl: { type: String, default: "" },
    prizePool: { type: Number, default: 0, min: 0 },
    prizes: [
      {
        place: { type: String, required: true },
        prize: { type: String, required: true },
        amount: { type: Number, default: 0 },
      },
    ],
    isPrizeRevealed: { type: Boolean, default: false },
    prizeRevealedAt: { type: Date, default: null },
    teamMode: { type: Boolean, default: false },
    maxTeamSize: { type: Number, default: 4, min: 1 },
    judgeIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hostIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ status: 1, type: 1 });
EventSchema.index({ registrationEnd: 1 });
EventSchema.index({ eventStart: 1 });

export const Event = mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

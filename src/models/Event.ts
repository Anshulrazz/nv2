import mongoose, { Schema, Document } from "mongoose";

export interface IChallenge {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category?: string;
  points: number;
  flag?: string;
  hints?: string[];
  imageUrl?: string;
}

export interface IPublishedWinner {
  rank: number;
  participantId: mongoose.Types.ObjectId;
  submissionId?: mongoose.Types.ObjectId;
  prize?: string;
  note?: string;
}

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  bannerImage?: string;
  hostId: mongoose.Types.ObjectId;
  eventType: "hackathon" | "seminar" | "workshop" | "webinar" | "other";
  isPaid: boolean;
  priceINR: number;
  mode: "online" | "offline" | "hybrid";
  location?: string;
  meetingLink?: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  maxParticipants?: number | null;
  tags: string[];
  problemStatement?: string;
  prizes?: string;
  status: "upcoming" | "live" | "ended" | "cancelled";
  challenges?: IChallenge[];
  isResultsPublished: boolean;
  publishedResults?: IPublishedWinner[];
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, default: "General", trim: true },
  points: { type: Number, default: 100, min: 0 },
  flag: { type: String, default: "", trim: true },
  hints: { type: [String], default: [] },
  imageUrl: { type: String, default: "" },
});

const PublishedWinnerSchema = new Schema<IPublishedWinner>(
  {
    rank: { type: Number, required: true },
    participantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submissionId: { type: Schema.Types.ObjectId, ref: "EventSubmission" },
    prize: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventType: {
      type: String,
      enum: ["hackathon", "seminar", "workshop", "webinar", "other"],
      required: true,
      default: "hackathon",
      index: true,
    },
    isPaid: { type: Boolean, default: false, index: true },
    priceINR: { type: Number, default: 0, min: 0 },
    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      default: "online",
    },
    location: { type: String, default: "" },
    meetingLink: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },
    maxParticipants: { type: Number, default: null },
    tags: { type: [String], default: [] },
    problemStatement: { type: String, default: "" },
    prizes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["upcoming", "live", "ended", "cancelled"],
      default: "upcoming",
      index: true,
    },
    challenges: { type: [ChallengeSchema], default: [] },
    isResultsPublished: { type: Boolean, default: false },
    publishedResults: { type: [PublishedWinnerSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ status: 1, startDate: -1 });
EventSchema.index({ eventType: 1, status: 1 });

export const Event = mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

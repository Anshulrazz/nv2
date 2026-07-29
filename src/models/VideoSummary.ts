import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChapter {
  timestampSeconds: number;
  title: string;
  summary: string;
}

export interface IVideoSummary extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  videoId: string;
  videoUrl: string;
  title?: string;
  thumbnailUrl?: string;
  channelName?: string;
  durationSeconds?: number;
  transcriptRaw?: string;
  summary?: string;
  keyPoints?: string[];
  chapters?: IChapter[];
  status: "processing" | "completed" | "failed";
  errorMessage?: string;
  xpAwarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChapterSchema = new Schema<IChapter>(
  {
    timestampSeconds: { type: Number, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
  },
  { _id: false }
);

const VideoSummarySchema = new Schema<IVideoSummary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    videoId: { type: String, required: true, index: true },
    videoUrl: { type: String, required: true },
    title: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    channelName: { type: String, default: "" },
    durationSeconds: { type: Number, default: 0 },
    transcriptRaw: { type: String, default: "" },
    summary: { type: String, default: "" },
    keyPoints: { type: [String], default: [] },
    chapters: { type: [ChapterSchema], default: [] },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
    errorMessage: { type: String },
    xpAwarded: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate processing per user
VideoSummarySchema.index({ userId: 1, videoId: 1 });

// Fast cache index for global video lookup
VideoSummarySchema.index({ videoId: 1, status: 1 });

export const VideoSummary: Model<IVideoSummary> =
  mongoose.models.VideoSummary || mongoose.model<IVideoSummary>("VideoSummary", VideoSummarySchema);

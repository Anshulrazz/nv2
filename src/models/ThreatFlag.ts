import mongoose, { Schema, Document } from "mongoose";

export interface IThreatFlag extends Document {
  targetId: mongoose.Types.ObjectId | string;
  targetType: "note" | "blog" | "forum" | "comment" | "doubt" | "community_post" | "chat" | "direct_message";
  reporterId?: mongoose.Types.ObjectId;
  reporterName?: string;
  authorId?: mongoose.Types.ObjectId;
  authorName?: string;
  reason: string;
  flaggedText?: string;
  toxicityScore: number; // 0.0 to 1.0
  status: "pending" | "approved" | "purged" | "dismissed";
  adminNote?: string;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ThreatFlagSchema = new Schema<IThreatFlag>(
  {
    targetId: { type: Schema.Types.Mixed, required: true },
    targetType: {
      type: String,
      enum: ["note", "blog", "forum", "comment", "doubt", "community_post", "chat", "direct_message"],
      required: true,
    },
    reporterId: { type: Schema.Types.ObjectId, ref: "User" },
    reporterName: { type: String, default: "Automated Threat Engine" },
    authorId: { type: Schema.Types.ObjectId, ref: "User" },
    authorName: { type: String },
    reason: { type: String, required: true },
    flaggedText: { type: String },
    toxicityScore: { type: Number, default: 0.8 },
    status: {
      type: String,
      enum: ["pending", "approved", "purged", "dismissed"],
      default: "pending",
    },
    adminNote: { type: String },
    resolvedBy: { type: String },
  },
  { timestamps: true }
);

ThreatFlagSchema.index({ status: 1, createdAt: -1 });

export const ThreatFlag =
  mongoose.models.ThreatFlag || mongoose.model<IThreatFlag>("ThreatFlag", ThreatFlagSchema);

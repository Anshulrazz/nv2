import mongoose, { Schema, Document } from "mongoose";

export interface IResearchPaper extends Document {
  title: string;
  authors: string;
  abstract: string;
  fileUrl: string; // PDF link
  userId: mongoose.Types.ObjectId;
  userName: string;
  pointsAwarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResearchPaperSchema = new Schema<IResearchPaper>(
  {
    title: { type: String, required: true, trim: true },
    authors: { type: String, required: true, trim: true },
    abstract: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    pointsAwarded: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ResearchPaperSchema.index({ createdAt: -1 });

export const ResearchPaper =
  mongoose.models.ResearchPaper ||
  mongoose.model<IResearchPaper>("ResearchPaper", ResearchPaperSchema);

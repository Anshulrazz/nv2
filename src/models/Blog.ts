import mongoose, { Schema, Document } from "mongoose";

export interface IBlog extends Document {
  title: string;
  content: string;
  summary: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  published: boolean;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    summary: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    published: { type: Boolean, default: false },
    coverImage: { type: String },
  },
  { timestamps: true }
);

BlogSchema.index({ published: 1, createdAt: -1 });

export const Blog = mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IBookmark extends Document {
  title: string;
  url: string;
  userId: mongoose.Types.ObjectId;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, default: "General", trim: true },
  },
  { timestamps: true }
);

BookmarkSchema.index({ userId: 1, category: 1 });

export const Bookmark = mongoose.models.Bookmark || mongoose.model<IBookmark>("Bookmark", BookmarkSchema);

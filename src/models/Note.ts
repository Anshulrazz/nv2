import mongoose, { Schema, Document } from "mongoose";

export interface INoteVersion {
  _id?: mongoose.Types.ObjectId;
  title: string;
  content: Record<string, unknown>;
  updatedAt: Date;
}

export interface INote extends Document {
  title: string;
  content: Record<string, unknown>;
  folderId: mongoose.Types.ObjectId | null;
  userId: mongoose.Types.ObjectId;
  isFavorite: boolean;
  isTrashed: boolean;
  published: boolean;
  slug?: string;
  tags: string[];
  category: string;
  coverImage?: string;
  readingTime?: string;
  wordCount: number;
  seoTitle?: string;
  seoDescription?: string;
  scheduledAt?: Date;
  isPinned: boolean;
  upvotes: mongoose.Types.ObjectId[];
  isFlagged: boolean;
  assetUrl?: string;
  assetName?: string;
  versionHistory: INoteVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: Schema.Types.Mixed, default: {} },
    folderId: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isFavorite: { type: Boolean, default: false },
    isTrashed: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    slug: { type: String, sparse: true },
    tags: { type: [String], default: [] },
    category: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    readingTime: { type: String, default: "" },
    wordCount: { type: Number, default: 0 },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    scheduledAt: { type: Date },
    isPinned: { type: Boolean, default: false },
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isFlagged: { type: Boolean, default: false },
    assetUrl: { type: String, default: "" },
    assetName: { type: String, default: "" },
    versionHistory: [
      {
        title: { type: String, required: true },
        content: { type: Schema.Types.Mixed, required: true },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Add index for fast querying by userId, folderId, isFavorite, and isTrashed
NoteSchema.index({ userId: 1, folderId: 1 });
NoteSchema.index({ userId: 1, isFavorite: 1 });
NoteSchema.index({ userId: 1, isTrashed: 1 });
NoteSchema.index({ slug: 1 }, { unique: true, sparse: true });
NoteSchema.index({ published: 1, createdAt: -1 });

export const Note = mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);

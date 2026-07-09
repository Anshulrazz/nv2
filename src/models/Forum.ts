import mongoose, { Schema, Document } from "mongoose";

export interface IForumComment {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: Date;
}

export interface IForum extends Document {
  title: string;
  content: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  category: string;
  upvotes: mongoose.Types.ObjectId[];
  comments: IForumComment[];
  mediaUrl?: string;
  mediaType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ForumCommentSchema = new Schema<IForumComment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  userImage: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ForumSchema = new Schema<IForum>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    category: { type: String, required: true, default: "General" },
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [ForumCommentSchema],
    mediaUrl: { type: String },
    mediaType: { type: String },
  },
  { timestamps: true }
);

ForumSchema.index({ category: 1, createdAt: -1 });

export const Forum = mongoose.models.Forum || mongoose.model<IForum>("Forum", ForumSchema);

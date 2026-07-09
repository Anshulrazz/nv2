import mongoose, { Schema, Document } from "mongoose";

export interface ICommunityComment {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: Date;
}

export interface ICommunityPost extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userImage?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  likes: mongoose.Types.ObjectId[];
  comments: ICommunityComment[];
  createdAt: Date;
  updatedAt: Date;
}

const CommunityCommentSchema = new Schema<ICommunityComment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  userImage: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userImage: { type: String },
    content: { type: String, required: true },
    mediaUrl: { type: String },
    mediaType: { type: String },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [CommunityCommentSchema],
  },
  { timestamps: true }
);

CommunityPostSchema.index({ createdAt: -1 });

export const CommunityPost =
  mongoose.models.CommunityPost ||
  mongoose.model<ICommunityPost>("CommunityPost", CommunityPostSchema);

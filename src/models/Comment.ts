import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  noteId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userImage?: string;
  content: string;
  parentId: mongoose.Types.ObjectId | null;
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  isFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    noteId: { type: Schema.Types.ObjectId, ref: "Note", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userImage: { type: String },
    content: { type: String, required: true, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CommentSchema.index({ noteId: 1, parentId: 1 });

export const Comment = mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

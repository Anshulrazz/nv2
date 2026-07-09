import mongoose, { Schema, Document } from "mongoose";

export interface IRepost extends Document {
  originalNoteId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userImage?: string;
  commentary: string;
  createdAt: Date;
  updatedAt: Date;
}

const RepostSchema = new Schema<IRepost>(
  {
    originalNoteId: { type: Schema.Types.ObjectId, ref: "Note", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userImage: { type: String },
    commentary: { type: String, default: "" },
  },
  { timestamps: true }
);

RepostSchema.index({ userId: 1 });
RepostSchema.index({ originalNoteId: 1 });

export const Repost = mongoose.models.Repost || mongoose.model<IRepost>("Repost", RepostSchema);

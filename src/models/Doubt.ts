import mongoose, { Schema, Document } from "mongoose";

export interface IReply {
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoubt extends Document {
  title: string;
  content: string;
  userId: mongoose.Types.ObjectId;
  status: "open" | "resolved";
  replies: IReply[];
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<IReply>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const DoubtSchema = new Schema<IDoubt>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    replies: [ReplySchema],
  },
  { timestamps: true }
);

DoubtSchema.index({ userId: 1, createdAt: -1 });

export const Doubt = mongoose.models.Doubt || mongoose.model<IDoubt>("Doubt", DoubtSchema);

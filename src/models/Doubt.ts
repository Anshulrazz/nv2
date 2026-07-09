import mongoose, { Schema, Document } from "mongoose";

export interface IDoubt extends Document {
  title: string;
  content: string;
  userId: mongoose.Types.ObjectId;
  status: "open" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

const DoubtSchema = new Schema<IDoubt>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true }
);

DoubtSchema.index({ userId: 1, createdAt: -1 });

export const Doubt = mongoose.models.Doubt || mongoose.model<IDoubt>("Doubt", DoubtSchema);

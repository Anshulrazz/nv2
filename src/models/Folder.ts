import mongoose, { Schema, Document } from "mongoose";

export interface IFolder extends Document {
  name: string;
  color?: string;
  parentId: mongoose.Types.ObjectId | null;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Folder = mongoose.models.Folder || mongoose.model<IFolder>("Folder", FolderSchema);

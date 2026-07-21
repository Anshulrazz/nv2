import mongoose, { Schema, Document } from "mongoose";

export interface IProjectFile {
  path: string;
  content: string;
}

export interface IProject extends Document {
  title: string;
  description: string;
  content: string; // Brief description or fallback text
  files: IProjectFile[];
  productionImages: string[];
  isPremium: boolean;
  cost: number;
  ownerId: mongoose.Types.ObjectId;
  unlockedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    files: {
      type: [
        {
          path: { type: String, required: true },
          content: { type: String, default: "" },
        },
      ],
      default: [],
    },
    productionImages: { type: [String], default: [] },
    isPremium: { type: Boolean, default: false },
    cost: { type: Number, default: 100 },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    unlockedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }
);

export const Project = mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

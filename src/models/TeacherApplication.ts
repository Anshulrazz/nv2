import mongoose, { Schema, Document } from "mongoose";

export interface ITeacherApplication extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  qualification: string;
  subjectExpertise: string;
  experienceYears: number;
  bio: string;
  portfolioUrl?: string;
  payoutUpi?: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherApplicationSchema = new Schema<ITeacherApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    qualification: { type: String, required: true },
    subjectExpertise: { type: String, required: true },
    experienceYears: { type: Number, default: 0 },
    bio: { type: String, required: true },
    portfolioUrl: { type: String, default: "" },
    payoutUpi: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export const TeacherApplication =
  mongoose.models.TeacherApplication ||
  mongoose.model<ITeacherApplication>("TeacherApplication", TeacherApplicationSchema);

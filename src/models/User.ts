import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email: string;
  passwordHash?: string;
  image?: string;
  role: "user" | "teacher" | "admin";
  points: number;
  bio?: string;
  bannerImage?: string;
  isSuspended: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    image: { type: String },
    role: { type: String, enum: ["user", "teacher", "admin"], default: "user" },
    points: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    isSuspended: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

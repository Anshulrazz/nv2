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
  // Mobile password-reset fields (unused by web Auth.js)
  resetTokenHash?: string;
  resetTokenExpiry?: Date;
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
    // Mobile password-reset fields (unused by web Auth.js)
    resetTokenHash: { type: String },
    resetTokenExpiry: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

import mongoose, { Schema, Document, Types } from "mongoose";

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  deviceId?: string;
  deviceName?: string;
  platform?: "ios" | "android" | "web";
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    deviceId: { type: String },
    deviceName: { type: String },
    platform: {
      type: String,
      enum: ["ios", "android", "web"],
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index: MongoDB will auto-delete expired documents
      index: { expires: 0 },
    },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index for efficient lookups during refresh/revoke
RefreshTokenSchema.index({ userId: 1, tokenHash: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

export const RefreshToken =
  mongoose.models.RefreshToken ||
  mongoose.model<IRefreshToken>("RefreshToken", RefreshTokenSchema);

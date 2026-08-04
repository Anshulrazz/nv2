import mongoose, { Schema, Document } from "mongoose";

export interface ICertificate extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rank: number | null;
  displayName: string;
  issuedAt: Date;
  certificateUrl: string;
  revoked: boolean;
  revokedReason: string | null;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rank: { type: Number, default: null },
    displayName: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    certificateUrl: { type: String, default: "" },
    revoked: { type: Boolean, default: false },
    revokedReason: { type: String, default: null },
  },
  {
    timestamps: false,
  }
);

CertificateSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const Certificate =
  mongoose.models.Certificate || mongoose.model<ICertificate>("Certificate", CertificateSchema);

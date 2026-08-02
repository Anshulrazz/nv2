import mongoose, { Schema, Document } from "mongoose";

export interface IEventCertificateConfig {
  enabled: boolean;
  topN: number;
  templateId: string;
}

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string;
  category: string;
  createdBy: mongoose.Types.ObjectId;
  status: "draft" | "published" | "live" | "ended" | "archived";
  registrationStart: Date;
  registrationEnd: Date;
  eventStart: Date;
  eventEnd: Date;
  maxParticipants?: number | null;
  isPaid: boolean;
  entryFeeINR: number;
  rules?: string;
  challengeOrder: mongoose.Types.ObjectId[];
  certificate: IEventCertificateConfig;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateConfigSchema = new Schema<IEventCertificateConfig>(
  {
    enabled: { type: Boolean, default: true },
    topN: { type: Number, default: 3, min: 1, max: 10 },
    templateId: { type: String, default: "navy_gold" },
  },
  { _id: false }
);

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },
    category: { type: String, default: "Mixed", trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "live", "ended", "archived"],
      default: "draft",
      index: true,
    },
    registrationStart: { type: Date, required: true },
    registrationEnd: { type: Date, required: true },
    eventStart: { type: Date, required: true },
    eventEnd: { type: Date, required: true },
    maxParticipants: { type: Number, default: null },
    isPaid: { type: Boolean, default: false, index: true },
    entryFeeINR: { type: Number, default: 0, min: 0 },
    rules: { type: String, default: "" },
    challengeOrder: { type: [{ type: Schema.Types.ObjectId, ref: "Challenge" }], default: [] },
    certificate: { type: CertificateConfigSchema, default: () => ({ enabled: true, topN: 3, templateId: "navy_gold" }) },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ status: 1, eventStart: 1 });
EventSchema.index({ category: 1, status: 1 });

export const Event = mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

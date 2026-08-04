import mongoose, { Schema, Document } from "mongoose";

export interface IJudgingCriteria extends Document {
  eventId: mongoose.Types.ObjectId;
  label: string;
  maxScore: number;
  weight: number; // 0–1 fraction; all weights for an event should sum to 1
  order: number;
  createdAt: Date;
}

const JudgingCriteriaSchema = new Schema<IJudgingCriteria>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    label: { type: String, required: true, trim: true },
    maxScore: { type: Number, required: true, min: 1 },
    weight: { type: Number, required: true, min: 0, max: 1 },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

JudgingCriteriaSchema.index({ eventId: 1, order: 1 });

export const JudgingCriteria =
  mongoose.models.JudgingCriteria ||
  mongoose.model<IJudgingCriteria>("JudgingCriteria", JudgingCriteriaSchema);

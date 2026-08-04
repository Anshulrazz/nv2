import mongoose, { Schema, Document } from "mongoose";

export interface IEventHint extends Document {
  challengeId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  text: string;
  pointsDeducted: number;
  order: number;
  createdAt: Date;
}

const EventHintSchema = new Schema<IEventHint>(
  {
    challengeId: {
      type: Schema.Types.ObjectId,
      ref: "EventChallenge",
      required: true,
      index: true,
    },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    // text is not sent until unlocked — handled at API layer
    text: { type: String, required: true },
    pointsDeducted: { type: Number, default: 0, min: 0 },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

EventHintSchema.index({ challengeId: 1, order: 1 });

export const EventHint =
  mongoose.models.EventHint || mongoose.model<IEventHint>("EventHint", EventHintSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IEventTrack extends Document {
  eventId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  sponsorName: string | null;
  sponsorLogoUrl: string | null;
  prizeDescription: string;
  order: number;
  createdAt: Date;
}

const EventTrackSchema = new Schema<IEventTrack>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    sponsorName: { type: String, default: null },
    sponsorLogoUrl: { type: String, default: null },
    prizeDescription: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

EventTrackSchema.index({ eventId: 1, order: 1 });

export const EventTrack =
  mongoose.models.EventTrack || mongoose.model<IEventTrack>("EventTrack", EventTrackSchema);

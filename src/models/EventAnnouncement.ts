import mongoose, { Schema, Document } from "mongoose";

export interface IEventAnnouncement extends Document {
  eventId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  pinnedUntil: Date | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const EventAnnouncementSchema = new Schema<IEventAnnouncement>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    pinnedUntil: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

EventAnnouncementSchema.index({ eventId: 1, createdAt: -1 });

export const EventAnnouncement =
  mongoose.models.EventAnnouncement ||
  mongoose.model<IEventAnnouncement>("EventAnnouncement", EventAnnouncementSchema);

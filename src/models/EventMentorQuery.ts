import mongoose, { Schema, Document } from "mongoose";

export interface IEventMentorQuery extends Document {
  eventId: mongoose.Types.ObjectId;
  fromUserId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId | null;
  question: string;
  status: "open" | "answered";
  mentorUserId: mongoose.Types.ObjectId | null;
  answer: string | null;
  createdAt: Date;
  answeredAt: Date | null;
}

const EventMentorQuerySchema = new Schema<IEventMentorQuery>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "EventTeam", default: null },
    question: { type: String, required: true },
    status: { type: String, enum: ["open", "answered"], default: "open", index: true },
    mentorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    answer: { type: String, default: null },
    answeredAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

EventMentorQuerySchema.index({ eventId: 1, status: 1, createdAt: -1 });

export const EventMentorQuery =
  mongoose.models.EventMentorQuery ||
  mongoose.model<IEventMentorQuery>("EventMentorQuery", EventMentorQuerySchema);

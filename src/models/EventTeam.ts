import mongoose, { Schema, Document } from "mongoose";

export interface IEventTeam extends Document {
  eventId: mongoose.Types.ObjectId;
  teamName: string;
  leaderUserId: mongoose.Types.ObjectId;
  memberUserIds: mongoose.Types.ObjectId[];
  lookingForMembers: boolean;
  createdAt: Date;
}

const EventTeamSchema = new Schema<IEventTeam>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    teamName: { type: String, required: true, trim: true },
    leaderUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    memberUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lookingForMembers: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

EventTeamSchema.index({ eventId: 1, teamName: 1 }, { unique: true });

export const EventTeam =
  mongoose.models.EventTeam || mongoose.model<IEventTeam>("EventTeam", EventTeamSchema);

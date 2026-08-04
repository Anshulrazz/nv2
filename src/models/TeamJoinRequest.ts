import mongoose, { Schema, Document } from "mongoose";

export interface ITeamJoinRequest extends Document {
  eventId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  fromUserId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  resolvedAt: Date | null;
}

const TeamJoinRequestSchema = new Schema<ITeamJoinRequest>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "EventTeam", required: true, index: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
    resolvedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// One pending request per user per team
TeamJoinRequestSchema.index({ teamId: 1, fromUserId: 1 }, { unique: true });

export const TeamJoinRequest =
  mongoose.models.TeamJoinRequest ||
  mongoose.model<ITeamJoinRequest>("TeamJoinRequest", TeamJoinRequestSchema);

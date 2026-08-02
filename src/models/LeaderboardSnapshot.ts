import mongoose, { Schema, Document } from "mongoose";

export interface ILeaderboardEntry {
  userId: mongoose.Types.ObjectId;
  displayName: string;
  username: string;
  totalPoints: number;
  totalTimeSeconds: number;
  lastSolveAt?: Date;
  completed: boolean;
}

export interface ILeaderboardSnapshot extends Document {
  eventId: mongoose.Types.ObjectId;
  entries: ILeaderboardEntry[];
  updatedAt: Date;
}

const LeaderboardEntrySchema = new Schema<ILeaderboardEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    displayName: { type: String, required: true },
    username: { type: String, required: true },
    totalPoints: { type: Number, default: 0 },
    totalTimeSeconds: { type: Number, default: 0 },
    lastSolveAt: { type: Date, default: null },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const LeaderboardSnapshotSchema = new Schema<ILeaderboardSnapshot>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, unique: true, index: true },
    entries: { type: [LeaderboardEntrySchema], default: [] },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

export const LeaderboardSnapshot =
  mongoose.models.LeaderboardSnapshot ||
  mongoose.model<ILeaderboardSnapshot>("LeaderboardSnapshot", LeaderboardSnapshotSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IEventSubmission extends Document {
  challengeId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId | null;
  submittedFlag: string; // plaintext submitted flag (logged for audit; not the stored hash)
  isCorrect: boolean;
  pointsAwarded: number;
  attemptNumber: number;
  submittedAt: Date;
}

const EventSubmissionSchema = new Schema<IEventSubmission>(
  {
    challengeId: {
      type: Schema.Types.ObjectId,
      ref: "EventChallenge",
      required: true,
      index: true,
    },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "EventTeam", default: null },
    submittedFlag: { type: String, required: true },
    isCorrect: { type: Boolean, required: true, default: false },
    pointsAwarded: { type: Number, default: 0 },
    attemptNumber: { type: Number, default: 1, min: 1 },
    submittedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

// Lookup: all submissions for a challenge in an event by user
EventSubmissionSchema.index({ eventId: 1, userId: 1, challengeId: 1 });
// Rate-limit check: count recent submissions by user for a challenge
EventSubmissionSchema.index({ userId: 1, challengeId: 1, submittedAt: 1 });

export const EventSubmission =
  mongoose.models.EventSubmission ||
  mongoose.model<IEventSubmission>("EventSubmission", EventSubmissionSchema);

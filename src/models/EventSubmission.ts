import mongoose, { Schema, Document } from "mongoose";

export interface ISolvedChallenge {
  challengeId: string;
  solvedAt: Date;
  pointsEarned: number;
}

export interface IEventSubmission extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectTitle: string;
  description: string;
  githubUrl?: string;
  demoUrl?: string;
  techStack: string[];
  score: number;
  solvedChallenges?: ISolvedChallenge[];
  feedback?: string;
  isShortlisted: boolean;
  submittedAt: Date;
  updatedAt: Date;
}

const SolvedChallengeSchema = new Schema<ISolvedChallenge>(
  {
    challengeId: { type: String, required: true },
    solvedAt: { type: Date, default: Date.now },
    pointsEarned: { type: Number, default: 0 },
  },
  { _id: false }
);

const EventSubmissionSchema = new Schema<IEventSubmission>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectTitle: { type: String, default: "Hackathon Entry", trim: true },
    description: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    demoUrl: { type: String, default: "" },
    techStack: { type: [String], default: [] },
    score: { type: Number, default: 0, min: 0, index: true },
    solvedChallenges: { type: [SolvedChallengeSchema], default: [] },
    feedback: { type: String, default: "" },
    isShortlisted: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// One submission per participant per hackathon
EventSubmissionSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const EventSubmission =
  mongoose.models.EventSubmission ||
  mongoose.model<IEventSubmission>("EventSubmission", EventSubmissionSchema);

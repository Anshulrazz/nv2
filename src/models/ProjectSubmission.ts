import mongoose, { Schema, Document } from "mongoose";

export interface IProjectSubmission extends Document {
  eventId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId | null;
  userId: mongoose.Types.ObjectId | null; // solo submission
  trackId: mongoose.Types.ObjectId | null;
  title: string;
  description: string;
  repoUrl: string;
  demoUrl: string;
  videoUrl: string;
  deckUrl: string;
  submittedAt: Date;
  isFinal: boolean; // locked after eventEnd — no further edits
  updatedAt: Date;
}

const ProjectSubmissionSchema = new Schema<IProjectSubmission>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "EventTeam", default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    trackId: { type: Schema.Types.ObjectId, ref: "EventTrack", default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    repoUrl: { type: String, default: "" },
    demoUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    deckUrl: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
    isFinal: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

ProjectSubmissionSchema.index({ eventId: 1, teamId: 1 });
ProjectSubmissionSchema.index({ eventId: 1, userId: 1 });

export const ProjectSubmission =
  mongoose.models.ProjectSubmission ||
  mongoose.model<IProjectSubmission>("ProjectSubmission", ProjectSubmissionSchema);

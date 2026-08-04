import mongoose, { Schema, Document } from "mongoose";

export interface IJudgeScoreCriterion {
  criterionKey: string;
  value: number;
}

export interface IJudgeScore extends Document {
  eventId: mongoose.Types.ObjectId;
  submissionId: mongoose.Types.ObjectId;
  judgeUserId: mongoose.Types.ObjectId;
  scores: IJudgeScoreCriterion[];
  comments: string;
  totalWeightedScore: number; // computed and stored on submit
  submittedAt: Date;
}

const JudgeScoreCriterionSchema = new Schema<IJudgeScoreCriterion>(
  {
    criterionKey: { type: String, required: true },
    value: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const JudgeScoreSchema = new Schema<IJudgeScore>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectSubmission",
      required: true,
      index: true,
    },
    judgeUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scores: { type: [JudgeScoreCriterionSchema], default: [] },
    comments: { type: String, default: "" },
    totalWeightedScore: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// One scorecard per judge per submission
JudgeScoreSchema.index({ submissionId: 1, judgeUserId: 1 }, { unique: true });

export const JudgeScore =
  mongoose.models.JudgeScore || mongoose.model<IJudgeScore>("JudgeScore", JudgeScoreSchema);

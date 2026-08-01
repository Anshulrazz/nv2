import { Schema, model, models } from "mongoose";

const UserQuizAttemptSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    videoSummary: { type: Schema.Types.ObjectId, ref: "VideoSummary", required: true },
    answers: { type: [Number], required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserQuizAttemptSchema.index({ user: 1, videoSummary: 1 }, { unique: true });

export default models.UserQuizAttempt || model("UserQuizAttempt", UserQuizAttemptSchema);

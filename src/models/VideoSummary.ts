import mongoose, { Schema, model, models } from "mongoose";

const QuizQuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true, validate: (v: string[]) => v.length === 4 },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const LectureSchema = new Schema(
  {
    title: { type: String, required: true },
    startApproxTimestamp: { type: String }, // e.g. "00:00" if derivable from transcript timing
    content: { type: String, required: true }, // 1000+ words, markdown
    wordCount: { type: Number, required: true },
  },
  { _id: false }
);

const VideoSummarySchema = new Schema(
  {
    videoId: { type: String, required: true, unique: true, index: true }, // YouTube video ID
    url: { type: String, required: true },
    title: { type: String, required: true },
    channelName: { type: String },
    thumbnailUrl: { type: String },
    durationSeconds: { type: Number },

    transcriptRaw: { type: String, required: true },
    transcriptLanguage: { type: String, default: "en" },

    summary: { type: String, required: true },
    keyPoints: { type: [String], required: true },
    lectures: { type: [LectureSchema], required: true },
    quiz: { type: [QuizQuestionSchema], required: true },

    beyondTheVideo: {
      funFacts: { type: [String], default: [] },
      realWorldConnections: { type: [String], default: [] },
      commonMisconceptions: { type: [String], default: [] },
      furtherExploration: { type: [String], default: [] }, // suggested related topics/searches, NOT external links
    },

    subject: { type: String }, // e.g. "Physics", "Chemistry" — AI-inferred, used for leaderboard/XP category
    examTags: { type: [String], default: [] }, // e.g. ["JEE", "NEET", "CBSE Class 12"]

    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    generationStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    failureReason: { type: String },
    aiModelUsed: { type: String, required: true },
    processingTimeMs: { type: Number },
  },
  { timestamps: true }
);

VideoSummarySchema.index({ generatedBy: 1, createdAt: -1 });
VideoSummarySchema.index({ subject: 1 });

export default models.VideoSummary || model("VideoSummary", VideoSummarySchema);

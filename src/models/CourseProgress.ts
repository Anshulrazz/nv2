import mongoose, { Schema, Document } from "mongoose";

export interface ICourseProgress extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  completedLessons: string[]; // Format: "moduleIdx-lessonIdx"
  quizScores: Record<string, { score: number; total: number }>; // Map of "moduleIdx-lessonIdx" to score
  isCompleted: boolean;
  completedAt?: Date;
  certificateId?: string; // Unique hash for certificate URL
  createdAt: Date;
  updatedAt: Date;
}

const CourseProgressSchema = new Schema<ICourseProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    completedLessons: { type: [String], default: [] },
    quizScores: { type: Schema.Types.Mixed, default: {} },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    certificateId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// Ensure a user can only have one progress document per course
CourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const CourseProgress = mongoose.models.CourseProgress || mongoose.model<ICourseProgress>("CourseProgress", CourseProgressSchema);

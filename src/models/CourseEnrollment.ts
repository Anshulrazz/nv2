import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourseEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  instructorId: mongoose.Types.ObjectId;
  pricePaid: number;
  creatorEarnings: number;
  adminEarnings: number;
  couponCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CourseEnrollmentSchema = new Schema<ICourseEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    instructorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    pricePaid: { type: Number, required: true, min: 0, default: 0 },
    creatorEarnings: { type: Number, required: true, min: 0, default: 0 },
    adminEarnings: { type: Number, required: true, min: 0, default: 0 },
    couponCode: { type: String },
  },
  { timestamps: true }
);

CourseEnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const CourseEnrollment: Model<ICourseEnrollment> =
  mongoose.models.CourseEnrollment ||
  mongoose.model<ICourseEnrollment>("CourseEnrollment", CourseEnrollmentSchema);

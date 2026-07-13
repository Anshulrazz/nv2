import mongoose, { Schema, Document } from "mongoose";

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface ILesson {
  title: string;
  text?: string;
  videoUrl?: string;
  photoUrl?: string;
  quiz?: IQuizQuestion[];
}

export interface IModule {
  title: string;
  lessons: ILesson[];
}

export interface ICourse extends Document {
  title: string;
  description: string;
  thumbnail?: string;
  instructor: mongoose.Types.ObjectId;
  isPublished: boolean;
  modules: IModule[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true, min: 0 },
});

const LessonSchema = new Schema<ILesson>({
  title: { type: String, required: true },
  text: { type: String },
  videoUrl: { type: String },
  photoUrl: { type: String },
  quiz: { type: [QuizQuestionSchema], default: [] },
});

const ModuleSchema = new Schema<IModule>({
  title: { type: String, required: true },
  lessons: { type: [LessonSchema], default: [] },
});

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    thumbnail: { type: String },
    instructor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublished: { type: Boolean, default: false },
    modules: { type: [ModuleSchema], default: [] },
  },
  { timestamps: true }
);

export const Course = mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);

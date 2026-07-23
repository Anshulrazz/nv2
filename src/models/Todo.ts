import mongoose, { Schema, Document } from "mongoose";

export interface ITodo extends Document {
  title: string;
  userId: mongoose.Types.ObjectId;
  isCompleted: boolean;
  reminderAt?: Date;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TodoSchema = new Schema<ITodo>(
  {
    title: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isCompleted: { type: Boolean, default: false },
    reminderAt: { type: Date },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TodoSchema.index({ userId: 1, isCompleted: 1 });

export const Todo = mongoose.models.Todo || mongoose.model<ITodo>("Todo", TodoSchema);

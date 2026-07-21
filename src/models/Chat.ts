import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  _id?: string | mongoose.Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface IChat extends Document {
  title: string;
  userId: mongoose.Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ChatSchema = new Schema<IChat>(
  {
    title: { type: String, default: "New chat", trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

// Index for fast lookup by user
ChatSchema.index({ userId: 1, updatedAt: -1 });

export const Chat = mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);

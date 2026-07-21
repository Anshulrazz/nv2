import mongoose, { Schema, Document } from "mongoose";

export interface IDirectMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  attachments: {
    url: string;
    type: "image" | "video" | "file" | "";
    name?: string;
  }[];
  isRead: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  repliedTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DirectMessageSchema = new Schema<IDirectMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    attachments: [
      {
        url: { type: String, required: true },
        type: { type: String, default: "" },
        name: { type: String, default: "" },
      },
    ],
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    repliedTo: {
      messageId: { type: Schema.Types.ObjectId, ref: "DirectMessage" },
      content: { type: String, default: "" },
      senderName: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// Indexes for high performance querying
DirectMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
DirectMessageSchema.index({ receiverId: 1, isRead: 1 });

export const DirectMessage =
  mongoose.models.DirectMessage ||
  mongoose.model<IDirectMessage>("DirectMessage", DirectMessageSchema);

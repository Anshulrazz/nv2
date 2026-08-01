import mongoose, { Schema, Document, Model } from "mongoose";

export interface INewsletter extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  status: "active" | "unsubscribed";
  source: string;
  subscribedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSchema = new Schema<INewsletter>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active",
    },
    source: {
      type: String,
      default: "footer",
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Newsletter: Model<INewsletter> =
  mongoose.models.Newsletter || mongoose.model<INewsletter>("Newsletter", NewsletterSchema);

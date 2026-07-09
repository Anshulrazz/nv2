import mongoose, { Schema, Document } from "mongoose";

export interface ISiteSetting extends Document {
  key: string;
  value: boolean;
  updatedAt: Date;
}

const SiteSettingSchema = new Schema<ISiteSetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Boolean, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const SiteSetting =
  mongoose.models.SiteSetting || mongoose.model<ISiteSetting>("SiteSetting", SiteSettingSchema);

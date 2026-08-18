import mongoose, { Schema, Document } from "mongoose";

export interface ISystemLog extends Document {
  level: "info" | "warn" | "error" | "security" | "telemetry";
  source: "auth" | "api" | "db" | "ai" | "moderation" | "system" | "payout" | "cron";
  message: string;
  ip?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const SystemLogSchema = new Schema<ISystemLog>(
  {
    level: {
      type: String,
      enum: ["info", "warn", "error", "security", "telemetry"],
      default: "info",
    },
    source: {
      type: String,
      enum: ["auth", "api", "db", "ai", "moderation", "system", "payout", "cron"],
      default: "system",
    },
    message: { type: String, required: true },
    ip: { type: String },
    userId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SystemLogSchema.index({ createdAt: -1 });
SystemLogSchema.index({ level: 1, createdAt: -1 });

export const SystemLog =
  mongoose.models.SystemLog || mongoose.model<ISystemLog>("SystemLog", SystemLogSchema);

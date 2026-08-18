import mongoose, { Schema, Document } from "mongoose";

export interface IServerTelemetry extends Document {
  hourKey: string; // e.g. "2026-08-19 01:00"
  requests: number;
  avgLatencyMs: number;
  errorCount: number;
  dbConnections: number;
  cpuLoad: number;
  createdAt: Date;
}

const ServerTelemetrySchema = new Schema<IServerTelemetry>(
  {
    hourKey: { type: String, required: true, unique: true },
    requests: { type: Number, default: 0 },
    avgLatencyMs: { type: Number, default: 12 },
    errorCount: { type: Number, default: 0 },
    dbConnections: { type: Number, default: 5 },
    cpuLoad: { type: Number, default: 15 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ServerTelemetrySchema.index({ hourKey: 1 });

export const ServerTelemetry =
  mongoose.models.ServerTelemetry ||
  mongoose.model<IServerTelemetry>("ServerTelemetry", ServerTelemetrySchema);

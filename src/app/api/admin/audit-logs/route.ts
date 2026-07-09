import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/models/AuditLog";

export const GET = auth(async function GET(req) {
  try {
    const session = req.auth;
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin required." }, { status: 403 });
    }

    await connectToDatabase();

    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Admin audit logs error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs." }, { status: 500 });
  }
});

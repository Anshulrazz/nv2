import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SiteSetting } from "@/models/SiteSetting";
import { AuditLog } from "@/models/AuditLog";
import mongoose from "mongoose";

export const GET = auth(async function GET() {
  try {
    await connectToDatabase();

    const settingsList = await SiteSetting.find({});
    // Map list to key-value config dictionary
    const config: Record<string, boolean> = {};
    settingsList.forEach((s) => {
      config[s.key] = s.value;
    });

    const defaults = {
      maintenanceMode: false,
      enableComments: true,
      enableRegistrations: true,
    };

    return NextResponse.json({ ...defaults, ...config });
  } catch (error) {
    console.error("Admin fetch settings error:", error);
    return NextResponse.json({ error: "Failed to load site configurations." }, { status: 500 });
  }
});

export const PATCH = auth(async function PATCH(req) {
  try {
    const session = req.auth;
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin required." }, { status: 403 });
    }

    const { key, value } = await req.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required." }, { status: 400 });
    }

    await connectToDatabase();

    const setting = await SiteSetting.findOneAndUpdate(
      { key },
      { $set: { value } },
      { upsert: true, new: true }
    );

    // Track setting update in AuditLog
    await AuditLog.create({
      adminId: new mongoose.Types.ObjectId(session.user.id),
      adminName: session.user.name || "Admin",
      action: "site_setting_update",
      details: `Updated site setting [${key}] to: ${value}`,
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Admin modify settings error:", error);
    return NextResponse.json({ error: "Failed to update configurations." }, { status: 500 });
  }
});

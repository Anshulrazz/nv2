import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Folder } from "@/models/Folder";
import { Note } from "@/models/Note";
import { Chat } from "@/models/Chat";
import { AuditLog } from "@/models/AuditLog";
import mongoose from "mongoose";

export const GET = auth(async function GET(req) {
  try {
    const session = req.auth;
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin required." }, { status: 403 });
    }

    await connectToDatabase();

    const users = await User.find({}).select("name email role points isSuspended createdAt").sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Admin list users error:", error);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
});

export const PATCH = auth(async function PATCH(req) {
  try {
    const session = req.auth;
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin required." }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, action, role } = body;

    if (!targetUserId || !action) {
      return NextResponse.json({ error: "targetUserId and action are required." }, { status: 400 });
    }

    await connectToDatabase();

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let logDetail = "";

    if (action === "suspend") {
      targetUser.isSuspended = true;
      logDetail = `Suspended user account: ${targetUser.email}`;
    } else if (action === "unsuspend") {
      targetUser.isSuspended = false;
      logDetail = `Unsuspended user account: ${targetUser.email}`;
    } else if (action === "role") {
      if (!role || !["admin", "user", "teacher"].includes(role)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }
      targetUser.role = role;
      logDetail = `Updated user role to ${role}: ${targetUser.email}`;
    }

    await targetUser.save();

    // Log admin action to database
    await AuditLog.create({
      adminId: new mongoose.Types.ObjectId(session.user.id),
      adminName: session.user.name || "Admin",
      action: `user_${action}`,
      targetId: targetUser._id,
      details: logDetail,
    });

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error("Admin user modification error:", error);
    return NextResponse.json({ error: "Failed to modify user." }, { status: 500 });
  }
});

export const DELETE = auth(async function DELETE(req) {
  try {
    const session = req.auth;
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url || "");
    const targetUserId = searchParams.get("targetUserId");

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required." }, { status: 400 });
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
    }

    await connectToDatabase();

    const userToDelete = await User.findById(targetUserId);
    if (!userToDelete) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Dependent cascade deletions
    await Promise.all([
      User.deleteOne({ _id: targetUserId }),
      Folder.deleteMany({ userId: targetUserId }),
      Note.deleteMany({ userId: targetUserId }),
      Chat.deleteMany({ userId: targetUserId }),
    ]);

    // Log audit log
    await AuditLog.create({
      adminId: new mongoose.Types.ObjectId(session.user.id),
      adminName: session.user.name || "Admin",
      action: "user_delete",
      targetId: new mongoose.Types.ObjectId(targetUserId),
      details: `Permanently deleted user and dependent notes/folders: ${userToDelete.email}`,
    });

    return NextResponse.json({ message: "User and dependent notes/folders deleted successfully." });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
});

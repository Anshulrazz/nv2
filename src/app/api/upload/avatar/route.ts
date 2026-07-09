import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import fs from "fs/promises";
import path from "path";

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Type validation limits
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, and WEBP are supported." }, { status: 400 });
    }

    // Size limit verification: max 2MB
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File exceeds 2MB limit." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Setup local avatars directories
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique name
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${userId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Save to local filesystem
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/avatars/${filename}`;

    // Update User model binding immediately
    await connectToDatabase();
    await User.findByIdAndUpdate(userId, { $set: { image: publicUrl } });

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Failed to upload avatar." }, { status: 500 });
  }
});

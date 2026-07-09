import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import fs from "fs/promises";
import path from "path";
import { getUploadsDir } from "@/lib/uploadUtils";

// Max 2 MB for avatars
const MAX_SIZE = 2 * 1024 * 1024;
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and WEBP are supported." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 2 MB limit." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Ensure avatars subdirectory exists
    const uploadDir = await getUploadsDir("avatars");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filename = `${userId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/avatars/${filename}`;

    await connectToDatabase();
    await User.findByIdAndUpdate(userId, { $set: { image: publicUrl } });

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar." },
      { status: 500 }
    );
  }
});


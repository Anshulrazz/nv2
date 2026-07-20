import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Folder } from "@/models/Folder";
import { isValidObjectId } from "@/lib/validation";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const folders = await Folder.find({ userId }).sort({ createdAt: 1 });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("Fetch folders error:", error);
    return NextResponse.json({ error: "Failed to fetch folders." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, parentId, color } = body;

    if (typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Folder name is required and must be a string." }, { status: 400 });
    }

    if (color !== undefined && color !== null && typeof color !== "string") {
      return NextResponse.json({ error: "Color must be a string or null." }, { status: 400 });
    }

    await connectToDatabase();

    if (parentId) {
      if (!isValidObjectId(parentId)) {
        return NextResponse.json({ error: "Invalid parent folder ID format." }, { status: 400 });
      }
      const parentFolder = await Folder.findOne({ _id: parentId, userId });
      if (!parentFolder) {
        return NextResponse.json({ error: "Parent folder not found or unauthorized." }, { status: 404 });
      }
    }

    const folder = await Folder.create({
      name: name.trim(),
      parentId: parentId || null,
      color: color || null,
      userId,
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json({ error: "Failed to create folder." }, { status: 500 });
  }
});

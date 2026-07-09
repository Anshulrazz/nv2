import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Folder } from "@/models/Folder";

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

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
    }

    await connectToDatabase();

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

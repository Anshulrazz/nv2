import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Doubt } from "@/models/Doubt";
import { User } from "@/models/User";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url || "");
    const userOnly = searchParams.get("userOnly");

    await connectToDatabase();
    const query: { userId?: string } = {};
    if (userOnly === "true") {
      query.userId = userId;
    }

    const doubts = await Doubt.find(query)
      .populate("userId", "name email image")
      .sort({ createdAt: -1 });

    return NextResponse.json(doubts);
  } catch (error) {
    console.error("Fetch doubts error:", error);
    return NextResponse.json({ error: "Failed to fetch doubts." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content } = body;

    if (typeof title !== "string" || typeof content !== "string" || title.trim() === "" || content.trim() === "") {
      return NextResponse.json({ error: "Title and content are required and must be strings." }, { status: 400 });
    }

    await connectToDatabase();

    const doubt = await Doubt.create({
      title: title.trim(),
      content: content.trim(),
      userId,
      status: "open",
    });

    // Award user points for asking doubts
    await User.updateOne({ _id: userId }, { $inc: { points: 10 } });

    return NextResponse.json(doubt, { status: 201 });
  } catch (error) {
    console.error("Create doubt error:", error);
    return NextResponse.json({ error: "Failed to create doubt." }, { status: 500 });
  }
});

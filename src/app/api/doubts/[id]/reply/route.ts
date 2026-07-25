import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Doubt } from "@/models/Doubt";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";

export const POST = auth(async function POST(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid doubt ID format." }, { status: 400 });
    }

    const body = await req.json();
    const { content } = body;

    if (typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ error: "Reply content is required." }, { status: 400 });
    }

    await connectToDatabase();

    const doubt = await Doubt.findById(id);
    if (!doubt) {
      return NextResponse.json({ error: "Doubt not found." }, { status: 404 });
    }

    const newReply = {
      userId,
      content: content.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    doubt.replies.push(newReply);
    await doubt.save();

    // Award bonus points for helping out
    await User.updateOne({ _id: userId }, { $inc: { points: 5 } });

    // Populate the newly added reply to return to the frontend
    await doubt.populate({ path: "replies.userId", select: "name email image", strictPopulate: false });

    return NextResponse.json(doubt, { status: 201 });
  } catch (error) {
    console.error("Create doubt reply error:", error);
    return NextResponse.json({ error: "Failed to post reply." }, { status: 500 });
  }
});

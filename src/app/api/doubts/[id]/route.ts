import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Doubt } from "@/models/Doubt";
import { User } from "@/models/User";

export const PATCH = auth(async function PATCH(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    const body = await req.json();
    const { status } = body;

    if (!status || !["open", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    await connectToDatabase();

    const doubt = await Doubt.findOne({ _id: id, userId });
    if (!doubt) {
      return NextResponse.json({ error: "Doubt not found or unauthorized." }, { status: 404 });
    }

    const oldStatus = doubt.status;
    doubt.status = status;
    await doubt.save();

    // Award bonus points for resolving doubts
    if (oldStatus === "open" && status === "resolved") {
      await User.updateOne({ _id: userId }, { $inc: { points: 15 } });
    }

    return NextResponse.json(doubt);
  } catch (error) {
    console.error("Update doubt error:", error);
    return NextResponse.json({ error: "Failed to update doubt." }, { status: 500 });
  }
});

export const DELETE = auth(async function DELETE(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);

    await connectToDatabase();

    const result = await Doubt.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Doubt not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ message: "Doubt deleted successfully." });
  } catch (error) {
    console.error("Delete doubt error:", error);
    return NextResponse.json({ error: "Failed to delete doubt." }, { status: 500 });
  }
});

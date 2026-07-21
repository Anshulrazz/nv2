import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export const POST = auth(async function POST(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid project ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (!project.isPremium) {
      return NextResponse.json({ error: "This is a free project. No need to unlock." }, { status: 400 });
    }

    const isOwner = project.ownerId.toString() === userId;
    const isAlreadyUnlocked = project.unlockedBy.some((uid: mongoose.Types.ObjectId) => uid.toString() === userId);

    if (isOwner || isAlreadyUnlocked) {
      return NextResponse.json({ error: "Project is already unlocked." }, { status: 400 });
    }

    // Check coins balance
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.coins < project.cost) {
      return NextResponse.json({ error: "Insufficient Coins balance. Earn more by referring friends." }, { status: 400 });
    }

    // Deduct coins and add user to unlockedBy list
    user.coins -= project.cost;
    await user.save();

    project.unlockedBy.push(userId);
    await project.save();

    return NextResponse.json({
      message: "Project unlocked successfully!",
      project: {
        id: project._id.toString(),
        title: project.title,
        content: project.content,
        files: project.files,
        productionImages: project.productionImages || [],
      },
      remainingCoins: user.coins,
    });
  } catch (error) {
    console.error("Unlock project error:", error);
    return NextResponse.json({ error: "Failed to unlock project." }, { status: 500 });
  }
});

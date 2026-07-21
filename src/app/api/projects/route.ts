import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import { z } from "zod";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const projectFileSchema = z.object({
  path: z.string().min(1, { message: "File path cannot be empty." }),
  content: z.string().default(""),
});

const createProjectSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(5, { message: "Description must be at least 5 characters." }),
  content: z.string().min(10, { message: "Content must be at least 10 characters." }),
  isPremium: z.boolean().default(false),
  cost: z.number().min(0).default(100),
  files: z.array(projectFileSchema).default([]),
  productionImages: z.array(z.string()).default([]),
});

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch all projects, populated with owner info
    const projects = await Project.find({})
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 });

    const formattedProjects = projects.map((proj) => {
      const isOwner = proj.ownerId?._id?.toString() === userId;
      const isUnlocked = proj.unlockedBy?.some((id: mongoose.Types.ObjectId) => id.toString() === userId);
      const isPremium = proj.isPremium;

      // Determine if locked
      const isLocked = isPremium && !isOwner && !isUnlocked;

      return {
        id: proj._id.toString(),
        title: proj.title,
        description: proj.description,
        content: isLocked ? "Locked Content. Please unlock with coins." : proj.content,
        files: isLocked ? [] : proj.files || [], // Redact premium source files if locked
        productionImages: proj.productionImages || [], // Expose production preview screenshots
        isPremium,
        cost: proj.cost,
        owner: {
          id: proj.ownerId?._id?.toString() || "",
          name: proj.ownerId?.name || "Anonymous",
          email: proj.ownerId?.email || "",
        },
        isLocked,
        isOwner,
        createdAt: proj.createdAt,
      };
    });

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createProjectSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, description, content, isPremium, cost, files, productionImages } = validated.data;

    await connectToDatabase();

    // Fetch current user to verify premium limits
    const user = await User.findById(userId);
    const isPremiumUser = user?.isPremiumUser || false;
    const limit = isPremiumUser ? 250 : 50;

    if (files.length > limit) {
      return NextResponse.json(
        { error: `Upload limit exceeded. Normal users can upload up to 50 files. Premium users can upload up to 250 files. (You provided ${files.length} files)` },
        { status: 400 }
      );
    }

    const newProject = await Project.create({
      title,
      description,
      content,
      files,
      productionImages,
      isPremium,
      cost: isPremium ? cost : 0,
      ownerId: userId,
      unlockedBy: [],
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Failed to create project." }, { status: 500 });
  }
});

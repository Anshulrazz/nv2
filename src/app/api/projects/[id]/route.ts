import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import { z } from "zod";

export const dynamic = "force-dynamic";

const projectFileSchema = z.object({
  path: z.string().min(1),
  content: z.string().default(""),
});

const updateProjectSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  content: z.string().min(10).optional(),
  isPremium: z.boolean().optional(),
  cost: z.number().min(0).optional(),
  files: z.array(projectFileSchema).optional(),
  productionImages: z.array(z.string()).optional(),
});

export const PATCH = auth(async function PATCH(req, { params }) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Only creator is allowed to modify
    if (project.ownerId.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this project." }, { status: 403 });
    }

    const body = await req.json();
    const validated = updateProjectSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
    }

    const updates = validated.data;

    // Validate limit on update
    if (updates.files) {
      const user = await User.findById(userId);
      const limit = user?.isPremiumUser ? 150 : 50;
      if (updates.files.length > limit) {
        return NextResponse.json(
          { error: `Upload limit exceeded. Normal users can upload up to 50 files. Premium users can upload up to 150 files. (You provided ${updates.files.length} files)` },
          { status: 400 }
        );
      }
    }

    // Apply updates
    if (updates.title !== undefined) project.title = updates.title;
    if (updates.description !== undefined) project.description = updates.description;
    if (updates.content !== undefined) project.content = updates.content;
    if (updates.isPremium !== undefined) project.isPremium = updates.isPremium;
    if (updates.cost !== undefined) project.cost = updates.isPremium ? updates.cost : 0;
    if (updates.files !== undefined) project.files = updates.files;
    if (updates.productionImages !== undefined) project.productionImages = updates.productionImages;

    project.updatedAt = new Date();
    await project.save();

    return NextResponse.json(project);
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Failed to update project." }, { status: 500 });
  }
});

export const DELETE = auth(async function DELETE(req, { params }) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Only owner can delete
    if (project.ownerId.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this project." }, { status: 403 });
    }

    await Project.deleteOne({ _id: id });

    return NextResponse.json({ message: "Project deleted successfully." });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Failed to delete project." }, { status: 500 });
  }
});

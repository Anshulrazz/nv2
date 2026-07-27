import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ResearchPaper } from "@/models/ResearchPaper";
import { isValidObjectId } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = auth(async function GET(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid research paper ID format." }, { status: 400 });
    }

    await connectToDatabase();
    const paper = await ResearchPaper.findById(id);
    if (!paper) {
      return NextResponse.json({ error: "Research paper not found." }, { status: 404 });
    }

    return NextResponse.json(paper);
  } catch (error) {
    console.error("Get research paper error:", error);
    return NextResponse.json({ error: "Failed to fetch research paper." }, { status: 500 });
  }
});

export const PATCH = auth(async function PATCH(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid research paper ID format." }, { status: 400 });
    }

    const body = await req.json();
    const { title, authors, abstract, content, fileUrl } = body;

    await connectToDatabase();

    const isAdmin = req.auth?.user?.role === "admin";
    const paper = await ResearchPaper.findById(id);
    if (!paper) {
      return NextResponse.json({ error: "Research paper not found." }, { status: 404 });
    }

    if (!isAdmin && paper.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized to edit this paper." }, { status: 403 });
    }

    if (title !== undefined && typeof title === "string") paper.title = title.trim();
    if (authors !== undefined && typeof authors === "string") paper.authors = authors.trim();
    if (abstract !== undefined && typeof abstract === "string") paper.abstract = abstract.trim();
    if (content !== undefined && typeof content === "string") paper.content = content;
    if (fileUrl !== undefined && typeof fileUrl === "string") paper.fileUrl = fileUrl.trim();

    await paper.save();
    return NextResponse.json(paper);
  } catch (error) {
    console.error("Update research paper error:", error);
    return NextResponse.json({ error: "Failed to update research paper." }, { status: 500 });
  }
});

export const DELETE = auth(async function DELETE(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid research paper ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const isAdmin = req.auth?.user?.role === "admin";
    const query = isAdmin ? { _id: id } : { _id: id, userId };
    const result = await ResearchPaper.deleteOne(query);
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Research paper not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ message: "Research paper deleted successfully." });
  } catch (error) {
    console.error("Delete research paper error:", error);
    return NextResponse.json({ error: "Failed to delete research paper." }, { status: 500 });
  }
});

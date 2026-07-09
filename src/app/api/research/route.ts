import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ResearchPaper } from "@/models/ResearchPaper";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const papers = await ResearchPaper.find({}).sort({ createdAt: -1 });
    return NextResponse.json(papers);
  } catch (error) {
    console.error("Fetch research papers error:", error);
    return NextResponse.json({ error: "Failed to fetch research papers." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, authors, abstract, fileUrl } = body;

    if (
      !title ||
      !authors ||
      !abstract ||
      !fileUrl ||
      title.trim() === "" ||
      authors.trim() === "" ||
      abstract.trim() === "" ||
      fileUrl.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Title, authors, abstract, and file are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const dbUser = await User.findById(userId);
    const userName = dbUser?.name || "Anonymous";

    const paper = await ResearchPaper.create({
      title: title.trim(),
      authors: authors.trim(),
      abstract: abstract.trim(),
      fileUrl: fileUrl.trim(),
      userId,
      userName,
      pointsAwarded: true,
    });

    // Award points (+50) for research paper posting
    await User.updateOne({ _id: userId }, { $inc: { points: 50 } });

    return NextResponse.json(paper, { status: 201 });
  } catch (error) {
    console.error("Create research paper error:", error);
    return NextResponse.json({ error: "Failed to upload research paper." }, { status: 500 });
  }
});

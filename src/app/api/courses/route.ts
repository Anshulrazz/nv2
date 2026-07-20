/* eslint-disable */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { User } from "@/models/User";

export const GET = auth(async function GET(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url || "");
    const instructorOnly = searchParams.get("instructorOnly");

    await connectToDatabase();
    
    let query: any = { isPublished: true };
    
    if (instructorOnly === "true") {
      const user = await User.findById(userId);
      if (!user || (user.role !== "teacher" && user.role !== "admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      query = { instructor: userId };
    }

    const courses = await Course.find(query).populate("instructor", "name image").sort({ createdAt: -1 });
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Fetch courses error:", error);
    return NextResponse.json({ error: "Failed to fetch courses." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(userId);
    
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden. Only teachers and admins can create courses." }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, thumbnail, isPublished, modules } = body;

    if (typeof title !== "string" || typeof description !== "string" || title.trim() === "" || description.trim() === "") {
      return NextResponse.json({ error: "Title and description are required and must be strings." }, { status: 400 });
    }

    if (thumbnail !== undefined && thumbnail !== null && typeof thumbnail !== "string") {
      return NextResponse.json({ error: "Thumbnail must be a string." }, { status: 400 });
    }

    if (isPublished !== undefined && typeof isPublished !== "boolean") {
      return NextResponse.json({ error: "isPublished must be a boolean." }, { status: 400 });
    }

    if (modules !== undefined && !Array.isArray(modules)) {
      return NextResponse.json({ error: "Modules must be an array." }, { status: 400 });
    }

    const course = await Course.create({
      title: title.trim(),
      description: description.trim(),
      thumbnail: thumbnail || null,
      isPublished: isPublished || false,
      modules: modules || [],
      instructor: userId,
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Create course error:", error);
    return NextResponse.json({ error: "Failed to create course." }, { status: 500 });
  }
});

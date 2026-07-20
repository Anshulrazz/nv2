import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validation";

export const GET = auth(async function GET(req, { params }) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid course ID format." }, { status: 400 });
    }

    await connectToDatabase();
    
    const course = await Course.findById(id).populate("instructor", "name image");
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Only allow instructor or admin to view unpublished courses
    if (!course.isPublished) {
      const user = await User.findById(userId);
      if (!user || (user.role !== "admin" && course.instructor._id.toString() !== userId)) {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Fetch course error:", error);
    return NextResponse.json({ error: "Failed to fetch course." }, { status: 500 });
  }
});

export const PUT = auth(async function PUT(req, { params }) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid course ID format." }, { status: 400 });
    }
    
    await connectToDatabase();
    const user = await User.findById(userId);
    
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden. Only teachers and admins can edit courses." }, { status: 403 });
    }

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (user.role !== "admin" && course.instructor.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden. You can only edit your own courses." }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, thumbnail, isPublished, modules } = body;

    const updates: Record<string, unknown> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return NextResponse.json({ error: "Title must be a non-empty string." }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim() === "") {
        return NextResponse.json({ error: "Description must be a non-empty string." }, { status: 400 });
      }
      updates.description = description.trim();
    }

    if (thumbnail !== undefined) {
      if (thumbnail !== null && typeof thumbnail !== "string") {
        return NextResponse.json({ error: "Thumbnail must be a string." }, { status: 400 });
      }
      updates.thumbnail = thumbnail;
    }

    if (isPublished !== undefined) {
      if (typeof isPublished !== "boolean") {
        return NextResponse.json({ error: "isPublished must be a boolean." }, { status: 400 });
      }
      updates.isPublished = isPublished;
    }

    if (modules !== undefined) {
      if (!Array.isArray(modules)) {
        return NextResponse.json({ error: "Modules must be an array." }, { status: 400 });
      }
      updates.modules = modules;
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Update course error:", error);
    return NextResponse.json({ error: "Failed to update course." }, { status: 500 });
  }
});

export const DELETE = auth(async function DELETE(req, { params }) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid course ID format." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(userId);
    
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden. Only teachers and admins can delete courses." }, { status: 403 });
    }

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (user.role !== "admin" && course.instructor.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden. You can only delete your own courses." }, { status: 403 });
    }

    await Course.findByIdAndDelete(id);

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json({ error: "Failed to delete course." }, { status: 500 });
  }
});

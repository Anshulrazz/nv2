import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { User } from "@/models/User";

export const GET = auth(async function GET(req, { params }) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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
    
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $set: body },
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

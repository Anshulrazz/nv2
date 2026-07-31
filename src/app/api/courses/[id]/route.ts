import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { CourseEnrollment } from "@/models/CourseEnrollment";
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

    const user = await User.findById(userId);

    // Only allow instructor or admin to view unpublished courses
    if (!course.isPublished) {
      if (!user || (user.role !== "admin" && course.instructor._id.toString() !== userId)) {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const isInstructor = course.instructor._id.toString() === userId;
    const isAdmin = user?.role === "admin";
    const isFree = !course.price || course.price === 0;

    let isEnrolled = isInstructor || isAdmin || isFree;

    if (!isEnrolled) {
      const enrollment = await CourseEnrollment.findOne({ userId, courseId: id });
      if (enrollment) {
        isEnrolled = true;
      }
    }

    const courseObj = course.toObject();
    courseObj.isEnrolled = isEnrolled;
    courseObj.price = course.price || 0;
    courseObj.isPaid = (course.price || 0) > 0;

    // Mask lesson video/text if course is locked and user is not enrolled
    if (!isEnrolled && courseObj.modules) {
      courseObj.modules = courseObj.modules.map((mod: { lessons?: Array<{ title: string; text?: string }> }) => ({
        ...mod,
        lessons: (mod.lessons || []).map((l: { title: string; text?: string }, idx: number) => ({
          title: l.title,
          isLocked: idx > 0 || courseObj.price > 0, // First lesson overview preview only if non-enrolled
          text: idx === 0 && !courseObj.isPaid ? l.text : undefined,
          videoUrl: undefined,
          photoUrl: undefined,
          quiz: [],
        })),
      }));
    }

    return NextResponse.json(courseObj);
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
    const { title, description, thumbnail, isPublished, modules, price } = body;

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

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
      }
      updates.price = numPrice;
      updates.isPaid = numPrice > 0;
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

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CourseProgress } from "@/models/CourseProgress";
import { Course } from "@/models/Course";
import { User } from "@/models/User";

export const GET = async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: certificateId } = await params;

    await connectToDatabase();
    
    // Find the progress document with this certificateId
    const progress = await CourseProgress.findOne({ certificateId });
    if (!progress) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Populate user and course details
    const user = await User.findById(progress.userId).select("name");
    const course = await Course.findById(progress.courseId).populate("instructor", "name");

    if (!user || !course) {
      return NextResponse.json({ error: "Associated records not found" }, { status: 404 });
    }

    return NextResponse.json({
      studentName: user.name || "Student",
      courseName: course.title,
      instructorName: course.instructor?.name || "Instructor",
      completedAt: progress.completedAt,
      certificateId: progress.certificateId,
    });
  } catch (error) {
    console.error("Fetch certificate error:", error);
    return NextResponse.json({ error: "Failed to fetch certificate." }, { status: 500 });
  }
};

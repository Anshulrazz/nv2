import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CourseProgress } from "@/models/CourseProgress";
import { Course } from "@/models/Course";
import crypto from "crypto";
import { isValidObjectId } from "@/lib/validation";

export const GET = auth(async function GET(req, { params }) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;
    if (!isValidObjectId(courseId)) {
      return NextResponse.json({ error: "Invalid course ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress) {
      return NextResponse.json({
        completedLessons: [],
        quizScores: {},
        isCompleted: false,
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Fetch course progress error:", error);
    return NextResponse.json({ error: "Failed to fetch progress." }, { status: 500 });
  }
});

export const POST = auth(async function POST(req, { params }) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;
    if (!isValidObjectId(courseId)) {
      return NextResponse.json({ error: "Invalid course ID format." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    await connectToDatabase();

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    let progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress) {
      progress = new CourseProgress({ userId, courseId });
    }

    // 1. Mark lesson as complete (Supports both completedLesson and action === 'completeLesson')
    const targetLessonKey =
      body.completedLesson ||
      (body.action === "completeLesson" ? body.lessonId || body.completedLesson : null);

    if (targetLessonKey && typeof targetLessonKey === "string") {
      if (!progress.completedLessons.includes(targetLessonKey)) {
        progress.completedLessons.push(targetLessonKey);
      }
    }

    // 2. Handle quiz submission (Supports both submitQuiz and action === 'quiz')
    const quizPayload = body.submitQuiz || (body.action === "quiz" ? body : null);
    if (quizPayload) {
      const lessonKey = quizPayload.lessonKey || quizPayload.lessonId;
      const score = typeof quizPayload.score === "number" ? quizPayload.score : 0;
      const total = typeof quizPayload.total === "number" ? quizPayload.total : 1;

      if (lessonKey && typeof lessonKey === "string") {
        const scores = progress.quizScores || {};
        scores[lessonKey] = { score, total };
        progress.quizScores = scores;
        progress.markModified("quizScores");

        if (!progress.completedLessons.includes(lessonKey)) {
          progress.completedLessons.push(lessonKey);
        }
      }
    }

    // 3. Auto-check full course completion status
    let totalLessonsCount = 0;
    let completedLessonsCount = 0;

    if (Array.isArray(course.modules)) {
      course.modules.forEach((mod: { lessons?: Array<unknown> }, mIdx: number) => {
        if (Array.isArray(mod.lessons)) {
          mod.lessons.forEach((_, lIdx: number) => {
            totalLessonsCount++;
            const key = `${mIdx}-${lIdx}`;
            if (progress.completedLessons.includes(key)) {
              completedLessonsCount++;
            }
          });
        }
      });
    }

    const isFullCourseCompleted =
      totalLessonsCount > 0 && completedLessonsCount >= totalLessonsCount;

    if (isFullCourseCompleted || body.completeCourse || body.action === "completeCourse") {
      if (!progress.isCompleted) {
        progress.isCompleted = true;
        progress.completedAt = new Date();
      }
      if (!progress.certificateId) {
        progress.certificateId = crypto.randomBytes(12).toString("hex");
      }
    }

    await progress.save();
    return NextResponse.json(progress);
  } catch (error) {
    console.error("Update course progress error:", error);
    return NextResponse.json({ error: "Failed to update progress." }, { status: 500 });
  }
});

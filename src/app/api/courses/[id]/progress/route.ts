/* eslint-disable */
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
      // Return default shape if no progress exists yet
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

    const body = await req.json();

    await connectToDatabase();

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    // Upsert the progress document
    let progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress) {
      progress = new CourseProgress({ userId, courseId });
    }

    // Handle marking a lesson as complete
    if (body.completedLesson) {
      if (typeof body.completedLesson !== "string") {
        return NextResponse.json({ error: "completedLesson must be a string." }, { status: 400 });
      }
      if (!progress.completedLessons.includes(body.completedLesson)) {
        progress.completedLessons.push(body.completedLesson);
      }
    }

    // Handle quiz submission
    if (body.submitQuiz) {
      const { lessonKey, score, total } = body.submitQuiz;
      if (typeof lessonKey !== "string" || typeof score !== "number" || typeof total !== "number") {
        return NextResponse.json({ error: "Invalid submitQuiz payload details." }, { status: 400 });
      }

      const scores = progress.quizScores || {};
      // Store the highest score if they retake it, or just overwrite it
      scores[lessonKey] = { score, total };
      progress.quizScores = scores;
      progress.markModified('quizScores');
      
      // Also mark the lesson as complete
      if (!progress.completedLessons.includes(lessonKey)) {
        progress.completedLessons.push(lessonKey);
      }
    }

    // Handle course completion
    if (body.completeCourse) {
      // Find the last lesson key
      if (!course.modules || course.modules.length === 0) {
        return NextResponse.json({ error: "Course has no modules to complete." }, { status: 400 });
      }

      const lastModuleIdx = course.modules.length - 1;
      const lastModule = course.modules[lastModuleIdx];
      if (!lastModule.lessons || lastModule.lessons.length === 0) {
        return NextResponse.json({ error: "Course last module has no lessons." }, { status: 400 });
      }
      const lastLessonIdx = lastModule.lessons.length - 1;
      const lastLessonKey = `${lastModuleIdx}-${lastLessonIdx}`;

      // Automatically add the last lesson if requested in completeCourse
      if (!progress.completedLessons.includes(lastLessonKey)) {
        progress.completedLessons.push(lastLessonKey);
      }

      // STRICT BACKEND VERIFICATION
      // 1. Check all modules & lessons
      const missingLessons: string[] = [];
      const missingQuizzes: string[] = [];

      course.modules.forEach((mod: any, mIdx: number) => {
        if (mod.lessons) {
          mod.lessons.forEach((les: any, lIdx: number) => {
            const key = `${mIdx}-${lIdx}`;
            if (!progress.completedLessons.includes(key)) {
              missingLessons.push(`${mod.title} -> ${les.title}`);
            }
            if (les.quiz && les.quiz.length > 0) {
              const scores = progress.quizScores || {};
              if (!scores[key]) {
                missingQuizzes.push(`${mod.title} -> ${les.title} (Quiz)`);
              }
            }
          });
        }
      });

      if (missingLessons.length > 0 || missingQuizzes.length > 0) {
        const errorDetails = [
          missingLessons.length > 0 ? `Uncompleted lessons: ${missingLessons.join(", ")}` : "",
          missingQuizzes.length > 0 ? `Uncompleted quizzes: ${missingQuizzes.join(", ")}` : "",
        ].filter(Boolean).join("; ");

        return NextResponse.json({
          error: "Course completion requirements not met.",
          details: errorDetails
        }, { status: 400 });
      }

      if (!progress.isCompleted) {
        progress.isCompleted = true;
        progress.completedAt = new Date();
        // Generate a random unique certificate ID
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

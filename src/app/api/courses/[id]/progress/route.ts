/* eslint-disable */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CourseProgress } from "@/models/CourseProgress";
import { Course } from "@/models/Course";
import crypto from "crypto";

export const GET = auth(async function GET(req, { params }) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;

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
    const body = await req.json();

    await connectToDatabase();

    // Upsert the progress document
    let progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress) {
      progress = new CourseProgress({ userId, courseId });
    }

    // Handle marking a lesson as complete
    if (body.completedLesson) {
      if (!progress.completedLessons.includes(body.completedLesson)) {
        progress.completedLessons.push(body.completedLesson);
      }
    }

    // Handle quiz submission
    if (body.submitQuiz) {
      const { lessonKey, score, total } = body.submitQuiz;
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
      // In a real app, you'd strictly validate that all lessons are in `completedLessons`
      // and all quizzes are passed. For MVP, we trust the client request.
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

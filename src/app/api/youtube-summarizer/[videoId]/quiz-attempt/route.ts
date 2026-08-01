import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import VideoSummary from "@/models/VideoSummary";
import UserQuizAttempt from "@/models/UserQuizAttempt";
import { User } from "@/models/User";
import { pusherServer } from "@/lib/pusher";
import mongoose from "mongoose";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;
    const { videoId } = await params;
    const body = await req.json().catch(() => ({}));
    const { answers } = body; // Array of selected option indices [0, 2, 1, 3, ...]

    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid payload: 'answers' must be an array of numbers." }, { status: 400 });
    }

    await connectToDatabase();

    let summary;
    if (mongoose.Types.ObjectId.isValid(videoId)) {
      summary = await VideoSummary.findById(videoId);
    }
    if (!summary) {
      summary = await VideoSummary.findOne({ videoId });
    }

    if (!summary || !summary.quiz || summary.quiz.length === 0) {
      return NextResponse.json({ error: "Quiz not found for this video summary." }, { status: 404 });
    }

    const quizQuestions = summary.quiz;
    const totalQuestions = quizQuestions.length;

    // Score evaluation strictly on the backend
    let score = 0;
    const results = quizQuestions.map((q: any, idx: number) => {
      const selectedIndex = answers[idx] !== undefined ? Number(answers[idx]) : -1;
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) score++;

      return {
        questionIndex: idx,
        question: q.question,
        options: q.options,
        selectedIndex,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    // Check if user has already attempted this quiz
    const existingAttempt = await UserQuizAttempt.findOne({ user: userId, videoSummary: summary._id });

    let xpAwarded = 0;

    if (!existingAttempt) {
      // First attempt: Award +5 XP per correct answer
      xpAwarded = score * 5;

      await UserQuizAttempt.create({
        user: userId,
        videoSummary: summary._id,
        answers,
        score,
        totalQuestions,
        xpAwarded,
      });

      if (xpAwarded > 0) {
        await User.updateOne({ _id: userId }, { $inc: { points: xpAwarded } });

        try {
          await pusherServer.trigger(`user-${userId}`, "xp-updated", {
            pointsEarned: xpAwarded,
            reason: `Passed YouTube Summary Quiz (${score}/${totalQuestions})`,
          });
        } catch (pusherErr) {
          console.warn("[Pusher] Notification error:", pusherErr);
        }
      }
    } else {
      // Retake attempt: Update score & selected answers, but award 0 new XP to prevent farming
      existingAttempt.answers = answers;
      existingAttempt.score = score;
      await existingAttempt.save();
    }

    return NextResponse.json({
      success: true,
      score,
      totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      xpAwarded,
      isFirstAttempt: !existingAttempt,
      results,
    });
  } catch (error) {
    console.error("[Quiz Attempt API] Error submitting quiz attempt:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

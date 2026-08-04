import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { JudgingCriteria } from "@/models/JudgingCriteria";
import { JudgeScore } from "@/models/JudgeScore";
import { ProjectSubmission } from "@/models/ProjectSubmission";

// POST /api/events/[id]/grade — judge submits or updates scorecard for a submission
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const userId = session.user.id;
    const role = session.user.role ?? "user";

    await connectToDatabase();

    const event = await Event.findById(id)
      .select("judgeIds createdBy hostIds status")
      .lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // Auth check: judge must be in judgeIds, createdBy, hostIds, or admin
    const isJudge =
      role === "admin" ||
      event.createdBy?.toString() === userId ||
      event.hostIds?.some((h: { toString: () => string }) => h.toString() === userId) ||
      event.judgeIds?.some((j: { toString: () => string }) => j.toString() === userId);

    if (!isJudge) {
      return NextResponse.json({ error: "Forbidden. You are not a judge for this event." }, { status: 403 });
    }

    const body = await req.json();
    const { submissionId, scores, comments } = body; // scores: [{ criterionKey: string, value: number }]

    if (!submissionId) {
      return NextResponse.json({ error: "submissionId is required." }, { status: 400 });
    }

    const submission = await ProjectSubmission.findOne({ _id: submissionId, eventId: id });
    if (!submission) {
      return NextResponse.json({ error: "Project submission not found." }, { status: 404 });
    }

    // Fetch event rubric criteria
    const criteria = await JudgingCriteria.find({ eventId: id }).lean();
    const criteriaMap = new Map(criteria.map((c) => [c._id.toString(), c]));

    // Compute server-side weighted score
    let totalWeightedScore = 0;
    const validatedScores: { criterionKey: string; value: number }[] = [];

    if (Array.isArray(scores)) {
      for (const item of scores) {
        const crit = criteriaMap.get(item.criterionKey);
        if (crit) {
          // Clamp score to [0, maxScore]
          const scoreValue = Math.min(Math.max(0, Number(item.value) || 0), crit.maxScore);
          // Normalized weighted score component
          const weightedComponent = (scoreValue / crit.maxScore) * crit.weight * 100;
          totalWeightedScore += weightedComponent;
          validatedScores.push({ criterionKey: item.criterionKey, value: scoreValue });
        }
      }
    }

    // Upsert JudgeScore (one scorecard per judge per submission)
    const scorecard = await JudgeScore.findOneAndUpdate(
      { eventId: id, submissionId, judgeUserId: userId },
      {
        eventId: id,
        submissionId,
        judgeUserId: userId,
        scores: validatedScores,
        comments: comments ?? "",
        totalWeightedScore: Math.round(totalWeightedScore * 100) / 100,
        submittedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ scorecard }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/events/[id]/grade]", err);
    return NextResponse.json({ error: "Grading failed." }, { status: 500 });
  }
}

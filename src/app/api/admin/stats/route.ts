import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PipelineStage } from "mongoose";
import { User } from "@/models/User";
import { Note } from "@/models/Note";
import { Forum } from "@/models/Forum";
import { Doubt } from "@/models/Doubt";

export const GET = auth(async function GET(req) {
  try {
    const session = req.auth;
    const userRole = session?.user?.role;

    // Secure route: verify admin permissions
    if (!session?.user?.id || userRole !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url || "");
    const interval = searchParams.get("interval") || "daily"; // daily | monthly | yearly

    await connectToDatabase();

    let format = "%Y-%m-%d";
    const dateBound = new Date();

    if (interval === "daily") {
      dateBound.setDate(dateBound.getDate() - 30); // Last 30 days
      format = "%Y-%m-%d";
    } else if (interval === "monthly") {
      dateBound.setMonth(0, 1); // Current year months
      format = "%Y-%m";
    } else {
      dateBound.setFullYear(dateBound.getFullYear() - 5); // Last 5 years
      format = "%Y";
    }

    const pipeline: PipelineStage[] = [
      { $match: { createdAt: { $gte: dateBound } } },
      {
        $group: {
          _id: { $dateToString: { format, date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    // Fetch aggregate statistics from collections in parallel
    const [usersStats, notesStats, forumsStats, doubtsStats] = await Promise.all([
      User.aggregate(pipeline),
      Note.aggregate(pipeline),
      Forum.aggregate(pipeline),
      Doubt.aggregate(pipeline),
    ]);

    // Consolidate dates/times into sorted labels
    const allLabels = new Set<string>();
    usersStats.forEach((g) => allLabels.add(g._id));
    notesStats.forEach((g) => allLabels.add(g._id));
    forumsStats.forEach((g) => allLabels.add(g._id));
    doubtsStats.forEach((g) => allLabels.add(g._id));

    const sortedLabels = Array.from(allLabels).sort();

    const chartData = sortedLabels.map((lbl) => ({
      label: lbl,
      users: usersStats.find((g) => g._id === lbl)?.count || 0,
      notes: notesStats.find((g) => g._id === lbl)?.count || 0,
      forums: forumsStats.find((g) => g._id === lbl)?.count || 0,
      doubts: doubtsStats.find((g) => g._id === lbl)?.count || 0,
    }));

    // Fetch snapshot totals for KPI cards
    const [totalUsers, totalNotes, totalForums, totalDoubts] = await Promise.all([
      User.countDocuments({}),
      Note.countDocuments({ isTrashed: false }),
      Forum.countDocuments({}),
      Doubt.countDocuments({}),
    ]);

    return NextResponse.json({
      chartData,
      totals: {
        users: totalUsers,
        notes: totalNotes,
        forums: totalForums,
        doubts: totalDoubts,
      },
    });
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    return NextResponse.json({ error: "Failed to gather statistics data." }, { status: 500 });
  }
});

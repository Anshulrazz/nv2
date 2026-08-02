import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { LeaderboardSnapshot, ILeaderboardEntry } from "@/models/LeaderboardSnapshot";
import { Attempt } from "@/models/Attempt";
import { Run } from "@/models/Run";
import { EventRegistration } from "@/models/EventRegistration";
import { pusherServer } from "@/lib/pusher";

/**
 * Recomputes or updates the leaderboard snapshot for an event and triggers Pusher live update.
 * Sort rule: totalPoints desc, totalTimeSeconds asc. Only users who have started their run appear.
 */
export async function updateLeaderboardSnapshot(eventId: string) {
  await connectToDatabase();

  const runs = await Run.find({ eventId }).lean();
  const solvedAttempts = await Attempt.find({ eventId, status: "solved" }).lean();
  const registrations = await EventRegistration.find({ eventId }).lean();

  const userStatsMap = new Map<
    string,
    { totalPoints: number; totalTimeSeconds: number; lastSolveAt?: Date; completed: boolean }
  >();

  // Initialize from Runs
  runs.forEach((r) => {
    const uid = r.userId.toString();
    userStatsMap.set(uid, {
      totalPoints: r.totalPoints || 0,
      totalTimeSeconds: r.totalTimeSeconds || 0,
      completed: r.status === "completed",
    });
  });

  // Accumulate solved attempts
  solvedAttempts.forEach((att) => {
    const uid = att.userId.toString();
    const existing = userStatsMap.get(uid) || { totalPoints: 0, totalTimeSeconds: 0, completed: false };
    if (!existing.lastSolveAt || (att.solvedAt && att.solvedAt > existing.lastSolveAt)) {
      existing.lastSolveAt = att.solvedAt;
    }
    userStatsMap.set(uid, existing);
  });

  const regMap = new Map<string, { displayName: string; username: string }>();
  registrations.forEach((reg) => {
    regMap.set(reg.userId.toString(), {
      displayName: reg.displayName || "Anonymous",
      username: reg.username || "user",
    });
  });

  const entries: ILeaderboardEntry[] = [];
  userStatsMap.forEach((stats, uid) => {
    const regInfo = regMap.get(uid) || { displayName: "Anonymous", username: "user" };
    entries.push({
      userId: uid as unknown as mongoose.Types.ObjectId,
      displayName: regInfo.displayName,
      username: regInfo.username,
      totalPoints: stats.totalPoints,
      totalTimeSeconds: stats.totalTimeSeconds,
      lastSolveAt: stats.lastSolveAt,
      completed: stats.completed,
    });
  });

  // Sort: totalPoints desc, totalTimeSeconds asc
  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.totalTimeSeconds - b.totalTimeSeconds;
  });

  const snapshot = await LeaderboardSnapshot.findOneAndUpdate(
    { eventId },
    { entries, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  // Broadcast via Pusher (channel: event-{eventId}-leaderboard, event: leaderboard:update)
  try {
    if (pusherServer) {
      await pusherServer.trigger(`event-${eventId}-leaderboard`, "leaderboard:update", {
        eventId,
        entries: entries.slice(0, 100), // top 100
        updatedAt: snapshot.updatedAt,
      });
    }
  } catch (err) {
    console.warn("[Pusher] Leaderboard trigger warning:", err);
  }

  return snapshot;
}

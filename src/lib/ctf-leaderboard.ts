import { connectToDatabase } from "@/lib/mongodb";
import { LeaderboardSnapshot, ILeaderboardEntry } from "@/models/LeaderboardSnapshot";
import { Attempt } from "@/models/Attempt";
import { EventRegistration } from "@/models/EventRegistration";
import { pusherServer } from "@/lib/pusher";

/**
 * Recomputes or updates the leaderboard snapshot for an event and triggers Pusher live update.
 * Sort rule: totalPoints desc, totalTimeSeconds asc.
 */
export async function updateLeaderboardSnapshot(eventId: string) {
  await connectToDatabase();

  // Aggregate all solved attempts for this event
  const solvedAttempts = await Attempt.find({ eventId, status: "solved" }).lean();
  const registrations = await EventRegistration.find({ eventId }).lean();

  const userStatsMap = new Map<string, { totalPoints: number; totalTimeSeconds: number; lastSolveAt?: Date }>();

  solvedAttempts.forEach((att) => {
    const uid = att.userId.toString();
    const existing = userStatsMap.get(uid) || { totalPoints: 0, totalTimeSeconds: 0 };
    existing.totalPoints += att.pointsAwarded || 0;
    existing.totalTimeSeconds += att.timeTakenSeconds || 0;
    if (!existing.lastSolveAt || (att.solvedAt && att.solvedAt > existing.lastSolveAt)) {
      existing.lastSolveAt = att.solvedAt;
    }
    userStatsMap.set(uid, existing);
  });

  const entries: ILeaderboardEntry[] = registrations.map((reg) => {
    const uid = reg.userId.toString();
    const stats = userStatsMap.get(uid) || { totalPoints: 0, totalTimeSeconds: 0 };
    return {
      userId: reg.userId,
      displayName: reg.displayName || "Anonymous",
      username: reg.username || "user",
      totalPoints: stats.totalPoints,
      totalTimeSeconds: stats.totalTimeSeconds,
      lastSolveAt: stats.lastSolveAt,
    };
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

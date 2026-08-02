import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Certificate } from "@/models/Certificate";
import { User } from "@/models/User";
import { updateLeaderboardSnapshot } from "@/lib/ctf-leaderboard";
import { isValidObjectId } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: identifier } = await params;
    await connectToDatabase();

    let event = null;
    if (isValidObjectId(identifier)) {
      event = await Event.findById(identifier);
    } else {
      event = await Event.findOne({ slug: identifier });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await User.findById(userId).select("role").lean();
    const isOwner = event.createdBy.toString() === userId;
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Only event owner or admin can end event." }, { status: 403 });
    }

    event.status = "ended";
    event.updatedAt = new Date();
    await event.save();

    // Recompute final leaderboard snapshot
    const snapshot = await updateLeaderboardSnapshot(event._id.toString());
    const topN = event.certificate?.topN || 3;
    const topEntries = (snapshot.entries || []).slice(0, topN);

    // Issue certificates for top performers
    const issuedCertificates = [];
    for (let i = 0; i < topEntries.length; i++) {
      const entry = topEntries[i];
      const rank = i + 1;
      const certUrl = `/certificates/${event._id}_${entry.userId}`;

      const cert = await Certificate.findOneAndUpdate(
        { eventId: event._id, userId: entry.userId },
        {
          rank,
          displayName: entry.displayName,
          issuedAt: new Date(),
          certificateUrl: certUrl,
        },
        { upsert: true, new: true }
      );
      issuedCertificates.push(cert);
    }

    return NextResponse.json({
      message: `🏁 Event ended. Issued certificates to top ${issuedCertificates.length} winners.`,
      event,
      certificates: issuedCertificates,
    });
  } catch (error) {
    console.error("POST /api/events/[id]/end error:", error);
    return NextResponse.json({ error: "Failed to end event" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
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
      return NextResponse.json({ error: "Forbidden: Only event host or admin can generate certificates." }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, rank = 1, mode = "single" } = body;

    if (mode === "bulk_all" || mode === "bulk_top3") {
      // Bulk certificate generation
      const snapshot = await updateLeaderboardSnapshot(event._id.toString());
      const limit = mode === "bulk_top3" ? (event.certificate?.topN || 3) : (snapshot.entries || []).length;
      const entriesToCertify = (snapshot.entries || []).slice(0, limit);

      const createdCerts = [];
      for (let i = 0; i < entriesToCertify.length; i++) {
        const entry = entriesToCertify[i];
        const certRank = i + 1;
        const certUrl = `/events/certificates/${event._id}_${entry.userId}`;

        const cert = await Certificate.findOneAndUpdate(
          { eventId: event._id, userId: entry.userId },
          {
            rank: certRank,
            displayName: entry.displayName,
            issuedAt: new Date(),
            certificateUrl: certUrl,
          },
          { upsert: true, new: true }
        );
        createdCerts.push(cert);
      }

      return NextResponse.json({
        message: `🎉 Bulk generated ${createdCerts.length} certificates successfully!`,
        count: createdCerts.length,
      });
    }

    // Single participant certificate generation
    if (!targetUserId || !isValidObjectId(targetUserId)) {
      return NextResponse.json({ error: "Invalid targetUserId provided." }, { status: 400 });
    }

    const reg = await EventRegistration.findOne({ eventId: event._id, userId: targetUserId });
    const participantName = reg?.displayName || "Competitor";

    const certUrl = `/events/certificates/${event._id}_${targetUserId}`;
    const certificate = await Certificate.findOneAndUpdate(
      { eventId: event._id, userId: targetUserId },
      {
        rank: Number(rank) || 1,
        displayName: participantName,
        issuedAt: new Date(),
        certificateUrl: certUrl,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: `🎉 Certificate generated for ${participantName} (Rank #${rank})!`,
      certificate,
    });
  } catch (error: unknown) {
    console.error("POST /api/events/[id]/certificates/generate error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate certificate";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

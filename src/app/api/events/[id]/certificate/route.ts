import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Certificate } from "@/models/Certificate";

// GET /api/events/[id]/certificate — fetch session user's certificate for event
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();

    const cert = await Certificate.findOne({
      eventId: id,
      userId: session.user.id,
    })
      .populate("eventId", "name type eventStart eventEnd")
      .lean();

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    }

    return NextResponse.json({ certificate: cert });
  } catch (err) {
    console.error("[GET /api/events/[id]/certificate]", err);
    return NextResponse.json({ error: "Failed to fetch certificate." }, { status: 500 });
  }
}

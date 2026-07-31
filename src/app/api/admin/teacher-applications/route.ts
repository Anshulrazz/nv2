import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { TeacherApplication } from "@/models/TeacherApplication";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    await connectToDatabase();

    const applications = await TeacherApplication.find({})
      .sort({ createdAt: -1 })
      .lean();

    const pendingCount = applications.filter((app) => app.status === "pending").length;

    return NextResponse.json({
      applications,
      pendingCount,
    });
  } catch (error) {
    console.error("Admin fetch teacher applications error:", error);
    return NextResponse.json({ error: "Failed to fetch teacher applications." }, { status: 500 });
  }
}

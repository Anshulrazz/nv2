import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { TeacherApplication } from "@/models/TeacherApplication";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    const { action, adminNote } = await req.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'." }, { status: 400 });
    }

    await connectToDatabase();

    const application = await TeacherApplication.findById(id);
    if (!application) {
      return NextResponse.json({ error: "Teacher application not found." }, { status: 404 });
    }

    const applicant = await User.findById(application.userId);
    if (!applicant) {
      return NextResponse.json({ error: "Applicant user record not found." }, { status: 404 });
    }

    if (action === "approve") {
      application.status = "approved";
      application.adminNote = adminNote?.trim() || "Application approved by Admin.";
      await application.save();

      applicant.role = "teacher";
      await applicant.save();

      // Create notification for user
      await Notification.create({
        userId: applicant._id,
        senderId: session.user.id,
        type: "system",
        content: "🎓 Congratulations! Your Teacher Application on Notexia has been Approved. You can now publish paid courses & earn 70% revenue share!",
      });

      return NextResponse.json({
        message: `Approved ${applicant.name || applicant.email} as Teacher!`,
        application,
      });
    } else {
      application.status = "rejected";
      application.adminNote = adminNote?.trim() || "Application rejected by Admin.";
      await application.save();

      // Notification
      await Notification.create({
        userId: applicant._id,
        senderId: session.user.id,
        type: "system",
        content: `Your Teacher Application status was updated to Rejected. Note: ${application.adminNote}`,
      });

      return NextResponse.json({
        message: `Teacher application for ${applicant.name || applicant.email} rejected.`,
        application,
      });
    }
  } catch (error) {
    console.error("Admin teacher application status update error:", error);
    return NextResponse.json({ error: "Failed to update teacher application status." }, { status: 500 });
  }
}

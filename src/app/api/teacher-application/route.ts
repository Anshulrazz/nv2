import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { TeacherApplication } from "@/models/TeacherApplication";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();

    const application = await TeacherApplication.findOne({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      hasApplication: !!application,
      application: application || null,
    });
  } catch (error) {
    console.error("Get Teacher Application error:", error);
    return NextResponse.json({ error: "Failed to fetch teacher application status." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { qualification, subjectExpertise, experienceYears, bio, portfolioUrl, payoutUpi } = await req.json();

    if (!qualification?.trim() || !subjectExpertise?.trim() || !bio?.trim()) {
      return NextResponse.json(
        { error: "Qualification, subject expertise, and bio are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.role === "teacher" || user.role === "admin") {
      return NextResponse.json(
        { message: "You are already a verified Teacher/Instructor." },
        { status: 400 }
      );
    }

    const existingPending = await TeacherApplication.findOne({
      userId: user._id,
      status: "pending",
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending Teacher Application under review by Admin." },
        { status: 400 }
      );
    }

    const application = await TeacherApplication.create({
      userId: user._id,
      userName: user.name || session.user.name || "Instructor Applicant",
      userEmail: user.email,
      qualification: qualification.trim(),
      subjectExpertise: subjectExpertise.trim(),
      experienceYears: Number(experienceYears) || 0,
      bio: bio.trim(),
      portfolioUrl: portfolioUrl?.trim() || "",
      payoutUpi: payoutUpi?.trim() || "",
      status: "pending",
    });

    if (payoutUpi?.trim()) {
      user.payoutDetails = {
        ...(user.payoutDetails || {}),
        upiId: payoutUpi.trim(),
      };
      await user.save();
    }

    return NextResponse.json(
      {
        message: "Teacher Application submitted successfully! Admin will review your profile shortly.",
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Teacher Application error:", error);
    return NextResponse.json({ error: "Failed to submit teacher application." }, { status: 500 });
  }
}

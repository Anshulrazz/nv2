import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Note } from "@/models/Note";

export const GET = auth(async function GET(req) {
  try {
    const session = req.auth;
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url || "");
    const target = searchParams.get("target") || "users"; // users | notes

    await connectToDatabase();

    if (target === "users") {
      const users = await User.find({}).sort({ createdAt: -1 });

      let csv = "ID,Name,Email,Role,Points,IsSuspended,CreatedAt\n";
      users.forEach((u) => {
        const cleanName = (u.name || "").replace(/"/g, '""');
        csv += `${u._id},"${cleanName}",${u.email},${u.role},${u.points},${u.isSuspended},${u.createdAt.toISOString()}\n`;
      });

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=nottexia-users-export.csv",
        },
      });
    } else {
      const notes = await Note.find({ published: true }).populate("userId", "email").sort({ createdAt: -1 });

      let csv = "ID,Title,AuthorEmail,Category,WordCount,ReadingTime,UpvotesCount,CreatedAt\n";
      notes.forEach((n) => {
        const cleanTitle = (n.title || "").replace(/"/g, '""');
        const authorEmail = (n.userId as unknown as { email?: string })?.email || "Unknown";
        csv += `${n._id},"${cleanTitle}",${authorEmail},"${n.category || ""}",${n.wordCount},"${n.readingTime || ""}",${n.upvotes?.length || 0},${n.createdAt.toISOString()}\n`;
      });

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=nottexia-posts-export.csv",
        },
      });
    }
  } catch (error) {
    console.error("Export data error:", error);
    return NextResponse.json({ error: "Failed to export data." }, { status: 500 });
  }
});

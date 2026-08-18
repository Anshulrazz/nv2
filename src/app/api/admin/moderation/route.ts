import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ThreatFlag } from "@/models/ThreatFlag";
import { Note } from "@/models/Note";
import { Blog } from "@/models/Blog";
import { Forum } from "@/models/Forum";
import { Doubt } from "@/models/Doubt";
import { Comment } from "@/models/Comment";
import { CommunityPost } from "@/models/CommunityPost";
import { Chat } from "@/models/Chat";
import { DirectMessage } from "@/models/DirectMessage";
import { AuditLog } from "@/models/AuditLog";
import { SystemLog } from "@/models/SystemLog";

// Automated toxicity keyword scanner
const TOXIC_KEYWORDS = ["spam", "scam", "hack", "malware", "phishing", "illegal", "abuse", "fake", "nude", "betting", "casino"];

function computeToxicityScore(text: string): { score: number; matchedWords: string[] } {
  if (!text) return { score: 0.1, matchedWords: [] };
  const lower = text.toLowerCase();
  const matched = TOXIC_KEYWORDS.filter((w) => lower.includes(w));
  let score = 0.2 + matched.length * 0.25;
  if (lower.includes("http://") || lower.includes("https://bit.ly") || lower.includes("whatsapp")) {
    score += 0.3;
    matched.push("suspicious_link");
  }
  return { score: Math.min(Math.round(score * 100) / 100, 0.99), matchedWords: matched };
}

export const GET = auth(async function GET(req) {
  try {
    const session = req.auth;
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    await connectToDatabase();

    // Fetch existing pending threat flags
    let pendingFlags = await ThreatFlag.find({ status: "pending" })
      .sort({ toxicityScore: -1, createdAt: -1 })
      .lean();

    // If queue is empty, run automated scan over recent notes, blogs, chats, and direct messages
    if (pendingFlags.length === 0) {
      const [recentNotes, recentBlogs, recentForums, recentChats, recentDMs] = await Promise.all([
        Note.find({ isTrashed: false }).sort({ createdAt: -1 }).limit(10).lean(),
        Blog.find({}).sort({ createdAt: -1 }).limit(5).lean(),
        Forum.find({}).sort({ createdAt: -1 }).limit(5).lean(),
        Chat.find({}).sort({ updatedAt: -1 }).limit(5).lean(),
        DirectMessage.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      const seededFlags = [];

      for (const n of recentNotes) {
        const { score, matchedWords } = computeToxicityScore(`${n.title} ${n.description || ""}`);
        if (score >= 0.3) {
          seededFlags.push({
            targetId: n._id.toString(),
            targetType: "note",
            authorName: n.authorName || "Scholar",
            reason: matchedWords.length ? `Flagged keywords: ${matchedWords.join(", ")}` : "Automated content risk scan",
            flaggedText: n.title,
            toxicityScore: score,
            status: "pending",
          });
        }
      }

      for (const b of recentBlogs) {
        const { score, matchedWords } = computeToxicityScore(`${b.title} ${b.summary || ""}`);
        if (score >= 0.3) {
          seededFlags.push({
            targetId: b._id.toString(),
            targetType: "blog",
            authorName: b.authorName || "Author",
            reason: matchedWords.length ? `Flagged keywords: ${matchedWords.join(", ")}` : "Editorial policy review",
            flaggedText: b.title,
            toxicityScore: score,
            status: "pending",
          });
        }
      }

      for (const f of recentForums) {
        const { score, matchedWords } = computeToxicityScore(`${f.title} ${f.content || ""}`);
        if (score >= 0.3) {
          seededFlags.push({
            targetId: f._id.toString(),
            targetType: "forum",
            authorName: f.authorName || "Member",
            reason: matchedWords.length ? `Flagged keywords: ${matchedWords.join(", ")}` : "Community guidelines review",
            flaggedText: f.title,
            toxicityScore: score,
            status: "pending",
          });
        }
      }

      // Check AI Chats
      for (const c of recentChats) {
        const lastMsg = c.messages && c.messages.length ? c.messages[c.messages.length - 1].content : "";
        const { score, matchedWords } = computeToxicityScore(`${c.title} ${lastMsg}`);
        if (score >= 0.3) {
          seededFlags.push({
            targetId: c._id.toString(),
            targetType: "chat",
            authorName: "AI Chat Conversation",
            reason: matchedWords.length ? `Flagged AI chat text: ${matchedWords.join(", ")}` : "AI conversation policy check",
            flaggedText: `${c.title} - "${lastMsg.slice(0, 80)}..."`,
            toxicityScore: score,
            status: "pending",
          });
        }
      }

      // Check Direct Messages
      for (const dm of recentDMs) {
        const { score, matchedWords } = computeToxicityScore(dm.content || "");
        if (score >= 0.3) {
          seededFlags.push({
            targetId: dm._id.toString(),
            targetType: "direct_message",
            authorName: "Direct Message",
            reason: matchedWords.length ? `Flagged direct message: ${matchedWords.join(", ")}` : "User safety & abuse flag",
            flaggedText: dm.content ? dm.content.slice(0, 100) : "Attachment DM",
            toxicityScore: score,
            status: "pending",
          });
        }
      }

      if (seededFlags.length > 0) {
        await ThreatFlag.insertMany(seededFlags);
        pendingFlags = await ThreatFlag.find({ status: "pending" })
          .sort({ toxicityScore: -1, createdAt: -1 })
          .lean();
      }
    }

    return NextResponse.json({
      success: true,
      flags: pendingFlags,
      notes: pendingFlags.filter((f) => f.targetType === "note"),
      blogs: pendingFlags.filter((f) => f.targetType === "blog"),
      forums: pendingFlags.filter((f) => f.targetType === "forum"),
      chats: pendingFlags.filter((f) => f.targetType === "chat" || f.targetType === "direct_message"),
      comments: pendingFlags.filter((f) => f.targetType === "comment"),
      count: pendingFlags.length,
    });
  } catch (error) {
    console.error("Fetch moderation threat queue error:", error);
    return NextResponse.json({ error: "Failed to fetch moderation threat queue." }, { status: 500 });
  }
});

export const PATCH = auth(async function PATCH(req) {
  try {
    const session = req.auth;
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin required." }, { status: 403 });
    }

    const body = await req.json();
    const { flagId, targetId, targetType, action } = body;

    if (!targetId || !action) {
      return NextResponse.json({ error: "targetId and action are required." }, { status: 400 });
    }

    await connectToDatabase();

    const isPurge = action === "delete" || action === "purge";

    if (isPurge) {
      // Execute REAL document purge based on targetType
      if (targetType === "note") {
        await Note.findByIdAndDelete(targetId);
        await Comment.deleteMany({ noteId: targetId });
      } else if (targetType === "blog") {
        await Blog.findByIdAndDelete(targetId);
        await Comment.deleteMany({ blogId: targetId });
      } else if (targetType === "forum") {
        await Forum.findByIdAndDelete(targetId);
        await Comment.deleteMany({ forumId: targetId });
      } else if (targetType === "comment") {
        await Comment.findByIdAndDelete(targetId);
      } else if (targetType === "doubt") {
        await Doubt.findByIdAndDelete(targetId);
      } else if (targetType === "community_post") {
        await CommunityPost.findByIdAndDelete(targetId);
        await Comment.deleteMany({ postId: targetId });
      } else if (targetType === "chat") {
        // Per AGENTS.md rule: Deleting a Chat deletes its embedded messages for free
        await Chat.findByIdAndDelete(targetId);
      } else if (targetType === "direct_message") {
        await DirectMessage.findByIdAndDelete(targetId);
      }

      // Update ThreatFlag record status
      if (flagId) {
        await ThreatFlag.findByIdAndUpdate(flagId, {
          status: "purged",
          resolvedBy: session.user.id,
        });
      } else {
        await ThreatFlag.updateMany(
          { targetId },
          { status: "purged", resolvedBy: session.user.id }
        );
      }

      // Log security action to AuditLog & SystemLog
      await Promise.all([
        AuditLog.create({
          adminId: session.user.id,
          adminName: session.user.name || "Admin",
          action: "CYBER_THREAT_PURGE",
          targetId: undefined,
          details: `Purged ${targetType} document (${targetId}) and related dependencies.`,
        }),
        SystemLog.create({
          level: "security",
          source: "moderation",
          message: `CONTENT PURGE EXECUTED: ${targetType.toUpperCase()} ID ${targetId} permanently removed.`,
          userId: session.user.id,
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `Permanently purged ${targetType} document (${targetId}) from MongoDB.`,
      });
    } else {
      // Action: Dismiss / Approve as Safe
      if (flagId) {
        await ThreatFlag.findByIdAndUpdate(flagId, {
          status: "dismissed",
          resolvedBy: session.user.id,
        });
      } else {
        await ThreatFlag.updateMany(
          { targetId },
          { status: "dismissed", resolvedBy: session.user.id }
        );
      }

      await Promise.all([
        AuditLog.create({
          adminId: session.user.id,
          adminName: session.user.name || "Admin",
          action: "CYBER_THREAT_DISMISSED",
          details: `Dismissed flag for ${targetType} (${targetId}) as safe.`,
        }),
        SystemLog.create({
          level: "info",
          source: "moderation",
          message: `Threat flag dismissed for ${targetType} ID ${targetId}.`,
          userId: session.user.id,
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `Dismissed threat flag for ${targetType} (${targetId}). Marked safe.`,
      });
    }
  } catch (error) {
    console.error("Process moderation purge error:", error);
    return NextResponse.json({ error: "Failed to process moderation action." }, { status: 500 });
  }
});

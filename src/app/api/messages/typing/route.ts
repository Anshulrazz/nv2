import { NextResponse } from "next/server";
import { auth } from "@/auth";

interface TypingEvent {
  recipientId: string;
  timestamp: number;
}

const globalWithTyping = global as typeof globalThis & {
  typingStatuses?: Record<string, TypingEvent>;
};

if (!globalWithTyping.typingStatuses) {
  globalWithTyping.typingStatuses = {};
}

import { isValidObjectId } from "@/lib/validation";

export const POST = auth(async function POST(req) {
  try {
    const currentUserId = req.auth?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipientId } = await req.json();
    if (!recipientId) {
      return NextResponse.json({ error: "recipientId is required." }, { status: 400 });
    }

    if (!isValidObjectId(recipientId)) {
      return NextResponse.json({ error: "Invalid recipient ID format." }, { status: 400 });
    }

    globalWithTyping.typingStatuses![currentUserId] = {
      recipientId,
      timestamp: Date.now(),
    };

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Typing notification error:", error);
    return NextResponse.json({ error: "Failed to process typing status." }, { status: 500 });
  }
});

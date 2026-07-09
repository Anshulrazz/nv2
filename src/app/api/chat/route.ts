import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Chat } from "@/models/Chat";
import { User } from "@/models/User";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export const POST = auth(async function POST(req) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, chatId, contextNoteContent } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    await connectToDatabase();

    interface IMessage {
      role: "user" | "assistant";
      content: string;
    }

    // Retrieve historical conversation context if active
    let previousMessages: IMessage[] = [];
    let chatDoc: { messages: IMessage[] } | null = null;

    if (chatId) {
      chatDoc = await Chat.findOne({ _id: chatId, userId }) as { messages: IMessage[] } | null;
      if (chatDoc) {
        previousMessages = chatDoc.messages || [];
      }
    }

    // Format chat context payload for Claude
    const formattedMessages: { role: "user" | "assistant"; content: string }[] = [];

    if (contextNoteContent) {
      formattedMessages.push({
        role: "user",
        content: `Here is the context of the active note I am working on. Use it to answer my queries if relevant:\n\n${contextNoteContent}\n\nMy question is: ${message}`
      });
    } else {
      previousMessages.forEach((msg: IMessage) => {
        formattedMessages.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        });
      });
      formattedMessages.push({
        role: "user",
        content: message,
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const textEncoder = new TextEncoder();

    // 1. Fallback simulated stream if API key is not present in development
    if (!apiKey || apiKey === "placeholder" || apiKey === "") {
      const responseText = `[WARNING: ANTHROPIC_API_KEY is not configured. Simulating Claude response.]\n\nI received your query: "${message}".\n\nIf you have a note open, its content is sent to help me reply. Feel free to use folders tree in the sidebar and create new documents. I can also help you with Doubts, Forums, Blogs, Bookmarks, and check the Admin Panel for analytics graphs!`;

      const readableStream = new ReadableStream({
        async start(controller) {
          const words = responseText.split(" ");
          for (const word of words) {
            controller.enqueue(textEncoder.encode(`data: ${JSON.stringify({ text: word + " " })}\n\n`));
            await new Promise((r) => setTimeout(r, 45)); // Typing speed simulation
          }

          // Save conversation logs
          try {
            await saveChatHistory(chatId, userId, message, responseText);
          } catch (e) {
            console.error("Save simulation error:", e);
          }

          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // 2. Real Claude SDK stream
    const anthropic = new Anthropic({ apiKey });
    const stream = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: "You are Claude, Notexia's built-in AI assistant. Help users structure notes, analyze content, resolve doubts, and write blogs.",
      messages: formattedMessages,
      stream: true,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        let assistantReply = "";

        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              const text = chunk.delta.text;
              assistantReply += text;
              controller.enqueue(textEncoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          // Log complete conversation in DB & award activity points
          await saveChatHistory(chatId, userId, message, assistantReply);
          await awardPoints(userId, 5);

        } catch (err) {
          console.error("Streaming error:", err);
          const errMsg = err instanceof Error ? err.message : String(err);
          controller.enqueue(textEncoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to initiate AI stream." }, { status: 500 });
  }
});

async function saveChatHistory(chatId: string | undefined, userId: string, message: string, reply: string) {
  if (chatId) {
    await Chat.updateOne(
      { _id: chatId, userId },
      {
        $push: {
          messages: [
            { role: "user", content: message },
            { role: "assistant", content: reply },
          ],
        },
      }
    );
  } else {
    await Chat.create({
      userId,
      title: message.substring(0, 30) + (message.length > 30 ? "..." : ""),
      messages: [
        { role: "user", content: message },
        { role: "assistant", content: reply },
      ],
    });
  }
}

async function awardPoints(userId: string, points: number) {
  try {
    await User.updateOne({ _id: userId }, { $inc: { points } });
  } catch (e) {
    console.error("Failed to award points:", e);
  }
}

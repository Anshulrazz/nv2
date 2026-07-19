// ─── Server-side Pusher Beams push helper ───
//
// Dispatches web push notifications to Pusher Beams using standard HTTP.
// Targets the specific user's interest group: user-{userId}.

import type { PushPayload } from "@/types/notification-types";

const INSTANCE_ID = process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID || "";
const SECRET_KEY = process.env.PUSHER_BEAMS_SECRET_KEY || "";
const BASE_URL = process.env.NEXTAUTH_URL || "https://nottexia.in";

/**
 * Send a web push notification to a user via Pusher Beams.
 * Publishes a payload targeting interest group: user-{userId}.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  console.log(`[Push-Server] sendPushToUser invoked for User ID: ${userId}. Payload:`, payload);

  if (!INSTANCE_ID || !SECRET_KEY) {
    console.warn("[Push-Server] Pusher Beams credentials are not configured — skipping push notification.");
    return;
  }

  const url = `https://${INSTANCE_ID}.pushnotifications.pusher.com/publish_api/v1/instances/${INSTANCE_ID}/publishes`;
  const deepLink = payload.link.startsWith("http") ? payload.link : `${BASE_URL}${payload.link}`;

  let iconUrl = `${BASE_URL}/logo.png`;
  if (payload.icon) {
    iconUrl = payload.icon.startsWith("http")
      ? payload.icon
      : `${BASE_URL}${payload.icon.startsWith("/") ? "" : "/"}${payload.icon}`;
  }

  const body = {
    interests: [`user-${userId}`],
    web: {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: iconUrl,
        deep_link: deepLink,
      },
    },
  };

  try {
    console.log(`[Push-Server] Dispatching HTTP request to Pusher Beams: ${url}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Push-Server] Pusher Beams publish returned error code ${response.status}:`,
        errorText
      );
      return;
    }

    const data = await response.json();
    console.log(`[Push-Server] Pusher Beams publish succeeded. Publish ID:`, data.publishId);
  } catch (error) {
    console.error("[Push-Server] Failed to dispatch web push notification via Pusher Beams:", error);
  }
}

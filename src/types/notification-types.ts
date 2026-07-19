// ─── Shared types for Pusher event payloads and notification content ───
//
// Every Pusher event uses one of these typed payloads.
// `resolveNotificationContent()` converts any event into a unified
// NotificationContent that feeds both in-app toasts and native/push
// notifications — no duplicated formatting logic anywhere.

// ────────────────────────────────────────────────────────────────────────
// Pusher event payloads (must match what the server actually emits)
// ────────────────────────────────────────────────────────────────────────

/** Emitted by POST /api/messages — an enriched DirectMessage doc */
export type NewMessagePayload = {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments: { url: string; type: "image" | "video" | "file" | ""; name?: string }[];
  isRead: boolean;
  createdAt: string;
  // Enriched fields added server-side
  senderName: string;
  senderImage: string;
};

/** Emitted by POST /api/messages (after marking messages as read) */
export type MessagesReadPayload = {
  readerId: string;
};

/** Emitted alongside new-message — a full Notification Mongoose doc */
export type NewNotificationPayload = {
  _id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  type: "like" | "comment" | "follow" | "mention" | "message";
  targetId: string;
  isRead: boolean;
  createdAt: string;
};

// ────────────────────────────────────────────────────────────────────────
// Unified notification content (single source of truth for display)
// ────────────────────────────────────────────────────────────────────────

export type NotificationContent = {
  title: string;
  body: string;
  image?: string;
  /** The route to navigate to when the user clicks the toast/notification */
  link: string;
  /** Stable key for deduplication (same key → don't show twice in a short window) */
  dedupKey: string;
};

// ────────────────────────────────────────────────────────────────────────
// Push notification payload (sent via web-push to the Service Worker)
// ────────────────────────────────────────────────────────────────────────

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  link: string;
};

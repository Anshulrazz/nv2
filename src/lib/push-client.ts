// ─── Browser-side Pusher Beams helpers ───
//
// Manages device registration and device interest subscriptions.
// Safe to call from client components (browser-check protected).

import { Client } from "@pusher/push-notifications-web";

let beamsClientInstance: Client | null = null;

/**
 * Lazy initialize the Beams Client instance only on browser side.
 */
function getBeamsClient(): Client | null {
  if (typeof window === "undefined") return null;

  if (!beamsClientInstance) {
    const instanceId = process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID;
    if (!instanceId) {
      console.error("[Beams-Client] NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID is not configured in env variables.");
      return null;
    }
    console.log("[Beams-Client] Initializing new Pusher Beams Client for Instance ID:", instanceId);
    beamsClientInstance = new Client({ instanceId });
  }
  return beamsClientInstance;
}

/**
 * Request notification permission from the user.
 * MUST be called from a user gesture (click handler).
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("[Beams-Client] Notification API is unsupported in this window context.");
    return "unsupported";
  }
  console.log(`[Beams-Client] requestNotificationPermission. Current state: ${Notification.permission}`);
  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    console.log(`[Beams-Client] User selected permission choice: ${result}`);
    return result;
  }
  return Notification.permission;
}

/**
 * Start Beams client and subscribe this browser device to the user's private interest: user-{userId}.
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  const client = getBeamsClient();
  if (!client) {
    console.warn("[Beams-Client] Beams client is not initialized or unsupported in current runtime.");
    return false;
  }

  console.log(`[Beams-Client] Subscribing browser device to interest 'user-${userId}'...`);
  try {
    // Starts the client, registers the service worker (by default /service-worker.js)
    console.log("[Beams-Client] Starting Beams client...");
    await client.start();
    console.log("[Beams-Client] Beams client started successfully.");

    // Add device interest for this user
    console.log(`[Beams-Client] Adding device interest: user-${userId}`);
    await client.addDeviceInterest(`user-${userId}`);
    console.log(`[Beams-Client] Subscribed to interest 'user-${userId}' successfully.`);
    return true;
  } catch (error) {
    console.error(`[Beams-Client] Failed to subscribe device to interest 'user-${userId}':`, error);
    return false;
  }
}

/**
 * Remove device interest subscription and stop Beams client registration.
 */
export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  const client = getBeamsClient();
  if (!client) return false;

  console.log(`[Beams-Client] Unsubscribing device from interest 'user-${userId}'...`);
  try {
    // Remove interest
    console.log(`[Beams-Client] Removing device interest: user-${userId}`);
    await client.removeDeviceInterest(`user-${userId}`);
    console.log(`[Beams-Client] Removed interest 'user-${userId}' successfully.`);

    // Clear state
    console.log("[Beams-Client] Stopping Beams client session...");
    await client.stop();
    console.log("[Beams-Client] Stopped Beams client successfully.");
    return true;
  } catch (error) {
    console.error(`[Beams-Client] Failed to unsubscribe device from interest 'user-${userId}':`, error);
    return false;
  }
}

/**
 * Check if the browser device is currently subscribed to interest: user-{userId}.
 */
export async function isPushSubscribed(userId: string): Promise<boolean> {
  const client = getBeamsClient();
  if (!client) return false;

  try {
    console.log("[Beams-Client] Fetching active device interests from Beams client...");
    const interests = await client.getDeviceInterests();
    const isSubbed = interests.includes(`user-${userId}`);
    console.log(`[Beams-Client] Current interests list:`, interests, `Subscribed to 'user-${userId}':`, isSubbed);
    return isSubbed;
  } catch (error) {
    console.error("[Beams-Client] Error checking active device interests:", error);
    return false;
  }
}

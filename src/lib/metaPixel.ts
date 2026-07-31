export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "857195406940874";

export const trackMetaEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
};

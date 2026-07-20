import mongoose from "mongoose";

/**
 * Validates whether the given value is a valid MongoDB ObjectId.
 */
export function isValidObjectId(id: unknown): id is string {
  if (typeof id !== "string") return false;
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Escapes special regex characters to prevent regex injection (ReDoS).
 */
export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Validates whether the given string is a valid HTTP/HTTPS URL.
 */
export function isValidUrl(urlStr: unknown): boolean {
  if (typeof urlStr !== "string") return false;
  try {
    const url = new URL(urlStr);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

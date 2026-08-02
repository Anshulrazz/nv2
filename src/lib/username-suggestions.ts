import { connectToDatabase } from "@/lib/mongodb";
import { EventRegistration } from "@/models/EventRegistration";
import { User } from "@/models/User";

export async function checkAndSuggestUsername(eventId: string, desiredUsername: string, displayName?: string) {
  await connectToDatabase();

  const cleanUsername = desiredUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");

  if (!cleanUsername) {
    return { available: false, suggestions: [] };
  }

  // Check in EventRegistration for this event
  const isRegisteredTaken = await EventRegistration.exists({ eventId, username: cleanUsername });
  // Also check global User collection if applicable
  const isGlobalTaken = await User.exists({ username: cleanUsername });

  const isAvailable = !isRegisteredTaken && !isGlobalTaken;

  if (isAvailable) {
    return { available: true, suggestions: [] };
  }

  // Generate 4 suggestions
  const base = (displayName || cleanUsername).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "coder";
  const num = Math.floor(10 + Math.random() * 89);
  const candidates = [
    `${base}${num}`,
    `${base}_dev`,
    `${base}.codes`,
    `${base}_ctf`,
  ];

  const suggestions: string[] = [];
  for (const cand of candidates) {
    const regTaken = await EventRegistration.exists({ eventId, username: cand });
    const userTaken = await User.exists({ username: cand });
    if (!regTaken && !userTaken) {
      suggestions.push(cand);
    }
  }

  return { available: false, suggestions: suggestions.slice(0, 4) };
}

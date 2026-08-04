/**
 * Event-level auth helper.
 *
 * requireAdminOrHost checks whether the current session user is allowed
 * to perform mutating actions on an event.
 *
 * Rules:
 *  - Admin always passes.
 *  - Creator (event.createdBy) always passes.
 *  - Any userId listed in event.hostIds passes.
 *  - Everyone else → 403.
 *
 * Usage:
 *   const { error, status } = await requireAdminOrHost(session, event);
 *   if (error) return NextResponse.json({ error }, { status });
 */

import mongoose from "mongoose";
import type { IEvent } from "@/models/Event";

interface SessionLike {
  user?: {
    id?: string;
    role?: string;
  } | null;
}

interface AuthResult {
  ok: true;
  userId: string;
  isAdmin: boolean;
}

interface AuthError {
  ok: false;
  error: string;
  status: 401 | 403;
}

type AuthCheck = AuthResult | AuthError;

/**
 * Check whether the session user may mutate an event.
 * Pass `event` as the full Mongoose document (or a plain object with createdBy / hostIds).
 * Pass `event = null` to only require admin (e.g. for event creation).
 */
export function requireAdminOrHost(
  session: SessionLike | null | undefined,
  event?: Pick<IEvent, "createdBy" | "hostIds"> | null
): AuthCheck {
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized. Please sign in.", status: 401 };
  }

  const userId = session.user.id;
  const role = session.user.role ?? "user";

  if (role === "admin") {
    return { ok: true, userId, isAdmin: true };
  }

  if (!event) {
    // No event context — only admins pass (e.g. event creation guard)
    return { ok: false, error: "Forbidden. Admin access required.", status: 403 };
  }

  const createdById = event.createdBy?.toString();
  const hostIdStrings = (event.hostIds ?? []).map((id: mongoose.Types.ObjectId | string) =>
    id.toString()
  );

  if (createdById === userId || hostIdStrings.includes(userId)) {
    return { ok: true, userId, isAdmin: false };
  }

  return { ok: false, error: "Forbidden. You are not a host of this event.", status: 403 };
}

/**
 * Require that the user is a registered (and active) participant of the event.
 * Returns the registration or an error.
 * This is a lighter check used in arena/submission routes.
 */
export function requireEventParticipant(
  session: SessionLike | null | undefined
): { ok: true; userId: string } | { ok: false; error: string; status: 401 } {
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized. Please sign in.", status: 401 };
  }
  return { ok: true, userId: session.user.id };
}

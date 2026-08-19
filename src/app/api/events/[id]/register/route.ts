import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { EventTeam } from "@/models/EventTeam";
import { User } from "@/models/User";
import { requireEventParticipant } from "@/lib/eventAuth";
import Razorpay from "razorpay";
import mongoose from "mongoose";

// Helper to escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Helper to generate a collision-free codename for team members or fallback codenames
// Pass `reserved` set to avoid collisions within a batch (not yet in DB)
async function generateUniqueCodename(
  eventId: string | mongoose.Types.ObjectId,
  baseName: string,
  reserved: Set<string> = new Set()
): Promise<string> {
  const sanitized = baseName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 16) || "participant";
  let candidate = sanitized;
  let attempt = 0;
  while (attempt < 10) {
    const lower = candidate.toLowerCase();
    if (!reserved.has(lower)) {
      const escapedCandidate = escapeRegex(lower);
      const exists = await EventRegistration.findOne({
        eventId,
        codename: { $regex: `^${escapedCandidate}$`, $options: "i" },
      });
      if (!exists) return candidate;
    }
    attempt++;
    candidate = `${sanitized}_${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `${sanitized}_${Date.now().toString().slice(-4)}`;
}

// POST /api/events/[id]/register
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let createdTeamId: mongoose.Types.ObjectId | null = null;
  let leaderRegistrationId: mongoose.Types.ObjectId | null = null;
  try {
    const { id } = await params;
    const session = await auth();

    // ── Auth check ────────────────────────────────────────────────────────
    const auth_check = requireEventParticipant(session);
    if (!auth_check.ok) {
      return NextResponse.json({ error: auth_check.error }, { status: auth_check.status });
    }
    const userId = auth_check.userId;

    const body = await req.json();
    const {
      codename,
      realName,
      acceptedCodeOfConduct,
      isTeamRegistration,
      teamName,
      memberEmails = [],
    } = body;

    // ── Required fields ───────────────────────────────────────────────────
    if (!codename || typeof codename !== "string" || !codename.trim()) {
      return NextResponse.json({ error: "Codename is required." }, { status: 400 });
    }
    if (!realName || typeof realName !== "string" || !realName.trim()) {
      return NextResponse.json({ error: "Real name is required." }, { status: 400 });
    }
    if (!acceptedCodeOfConduct) {
      return NextResponse.json(
        { error: "You must accept the Code of Conduct to register." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const event = isObjectId
      ? await Event.findById(id)
      : await Event.findOne({ slug: id });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const eventId = event._id;

    // ── Timing checks ───────────────────────────────────────────────────
    const now = new Date();
    if (now < event.registrationStart) {
      return NextResponse.json({ error: "Registration has not opened yet." }, { status: 400 });
    }
    if (now > event.registrationEnd) {
      return NextResponse.json({ error: "Registration has closed." }, { status: 400 });
    }
    if (!["published", "live"].includes(event.status)) {
      return NextResponse.json({ error: "Event is not accepting registrations." }, { status: 400 });
    }

    // ── Duplicate registration check for current user ─────────────────────
    const existing = await EventRegistration.findOne({ eventId, userId });
    if (existing) {
      return NextResponse.json(
        { error: "You are already registered for this event." },
        { status: 409 }
      );
    }

    // ── Codename uniqueness check & auto-resolution ───────────────────────
    let finalCodename = codename.trim();
    const codenameEscaped = escapeRegex(finalCodename.toLowerCase());
    const codenameExists = await EventRegistration.findOne({
      eventId,
      codename: { $regex: `^${codenameEscaped}$`, $options: "i" },
    });

    if (codenameExists) {
      // Auto-resolve codename by appending a unique random suffix instead of failing hard!
      finalCodename = await generateUniqueCodename(eventId, finalCodename);
    }

    // ── Team Mode & Member Validation ─────────────────────────────────────
    const registeringAsTeam = Boolean(isTeamRegistration || (event.teamMode && teamName));
    let memberUsers: Array<{ _id: mongoose.Types.ObjectId; email: string; name?: string; username?: string }> = [];

    if (registeringAsTeam) {
      if (!teamName || typeof teamName !== "string" || !teamName.trim()) {
        return NextResponse.json({ error: "Team name is required for team registration." }, { status: 400 });
      }

      const teamNameEscaped = escapeRegex(teamName.trim().toLowerCase());
      const existingTeam = await EventTeam.findOne({
        eventId,
        teamName: { $regex: `^${teamNameEscaped}$`, $options: "i" },
      });

      if (existingTeam) {
        return NextResponse.json(
          { error: `The team name "${teamName.trim()}" is already taken in this event. Please choose another team name.` },
          { status: 409 }
        );
      }

      // Validate member emails
      if (Array.isArray(memberEmails) && memberEmails.length > 0) {
        const normalizedEmails = Array.from(
          new Set(
            memberEmails
              .filter((e): e is string => typeof e === "string" && !!e.trim())
              .map((e) => e.trim().toLowerCase())
          )
        );

        const currentUser = await User.findById(userId).select("email").lean();
        const currentEmail = currentUser?.email?.toLowerCase();
        const cleanMemberEmails = normalizedEmails.filter((e) => e !== currentEmail);

        const maxTeamSize = event.maxTeamSize || 4;
        if (1 + cleanMemberEmails.length > maxTeamSize) {
          return NextResponse.json(
            { error: `Team exceeds maximum allowed size of ${maxTeamSize} members.` },
            { status: 400 }
          );
        }

        if (cleanMemberEmails.length > 0) {
          const foundUsers = await User.find({ email: { $in: cleanMemberEmails } })
            .select("_id name username email image")
            .lean();

          const foundEmails = new Set(foundUsers.map((u) => u.email.toLowerCase()));
          const missingEmails = cleanMemberEmails.filter((e) => !foundEmails.has(e));

          if (missingEmails.length > 0) {
            return NextResponse.json(
              {
                error: `The following email(s) are not registered on Notexia: ${missingEmails.join(
                  ", "
                )}. All team members must have a Notexia account before registration.`,
              },
              { status: 400 }
            );
          }

          const memberUserIds = foundUsers.map((u) => u._id);
          const alreadyRegisteredMembers = await EventRegistration.find({
            eventId,
            userId: { $in: memberUserIds },
          })
            .populate("userId", "name username email")
            .lean();

          if (alreadyRegisteredMembers.length > 0) {
            const names = alreadyRegisteredMembers
              .map((r) => {
                const u = r.userId as unknown as { name?: string; username?: string; email?: string } | null;
                return u?.name || u?.username || u?.email || "Team member";
              })
              .join(", ");
            return NextResponse.json(
              { error: `${names} is already registered for this event.` },
              { status: 409 }
            );
          }

          memberUsers = foundUsers as unknown as typeof memberUsers;
        }
      }
    }

    // ── Capacity Check ─────────────────────────────────────────────────────
    let isWaitlisted = false;
    if (event.capacity) {
      const neededSpots = registeringAsTeam ? 1 + memberUsers.length : 1;
      const activeCount = await EventRegistration.countDocuments({
        eventId,
        paymentStatus: { $in: ["not_required", "paid"] },
        isDisqualified: false,
      });
      if (activeCount + neededSpots > event.capacity) {
        isWaitlisted = true;
      }
    }

    // ── Create Team ────────────────────────────────────────────────────────
    let createdTeam = null;
    if (registeringAsTeam) {
      const allMemberUserIds = [
        new mongoose.Types.ObjectId(userId),
        ...memberUsers.map((u) => new mongoose.Types.ObjectId(u._id)),
      ];

      createdTeam = await EventTeam.create({
        eventId,
        teamName: teamName.trim(),
        leaderUserId: userId,
        memberUserIds: allMemberUserIds,
        lookingForMembers: false,
      });

      createdTeamId = createdTeam._id;
    }

    // ── Pre-generate all codenames upfront to avoid batch collisions ─────
    const reservedCodenames = new Set<string>([finalCodename.toLowerCase()]);
    const memberCodenames: string[] = [];

    if (createdTeam && memberUsers.length > 0) {
      for (const member of memberUsers) {
        const mc = await generateUniqueCodename(
          eventId,
          member.username || member.name || "member",
          reservedCodenames
        );
        reservedCodenames.add(mc.toLowerCase());
        memberCodenames.push(mc);
      }
    }

    // ── Payment handling ──────────────────────────────────────────────────
    if (event.isPaid && !isWaitlisted) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_SECRET;

      if (!keyId || !keySecret) {
        if (createdTeamId) await EventTeam.findByIdAndDelete(createdTeamId);
        return NextResponse.json({ error: "Payment gateway not configured." }, { status: 500 });
      }

      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const amountPaise = Math.round((event.price ?? 0) * 100);

      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: event.currency || "INR",
        receipt: `ev_${String(eventId).slice(-6)}_${userId.slice(-6)}_${Date.now()}`,
        notes: { eventId: String(eventId), userId, type: "event_registration" },
      });

      // Leader registration
      const leaderReg = await EventRegistration.create({
        eventId,
        userId,
        codename: finalCodename,
        realName: realName.trim(),
        teamId: createdTeam?._id ?? null,
        paymentStatus: "pending",
        razorpayOrderId: order.id,
        acceptedCodeOfConduct: true,
      });
      leaderRegistrationId = leaderReg._id;

      // Team members registration
      if (createdTeam && memberUsers.length > 0) {
        for (let i = 0; i < memberUsers.length; i++) {
          const member = memberUsers[i];
          await EventRegistration.create({
            eventId,
            userId: member._id,
            codename: memberCodenames[i],
            realName: member.name || member.username || "Team Member",
            teamId: createdTeam._id,
            paymentStatus: "pending",
            razorpayOrderId: order.id,
            acceptedCodeOfConduct: true,
          });
        }
      }

      return NextResponse.json(
        {
          registration: leaderReg,
          team: createdTeam,
          requiresPayment: true,
          order: {
            id: order.id,
            amount: amountPaise,
            currency: event.currency || "INR",
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
          },
        },
        { status: 201 }
      );
    }

    // Free event (or waitlisted)
    const leaderReg = await EventRegistration.create({
      eventId,
      userId,
      codename: finalCodename,
      realName: realName.trim(),
      teamId: createdTeam?._id ?? null,
      paymentStatus: isWaitlisted ? "waitlisted" : "not_required",
      acceptedCodeOfConduct: true,
    });
    leaderRegistrationId = leaderReg._id;

    // Register all team members
    if (createdTeam && memberUsers.length > 0) {
      for (let i = 0; i < memberUsers.length; i++) {
        const member = memberUsers[i];
        await EventRegistration.create({
          eventId,
          userId: member._id,
          codename: memberCodenames[i],
          realName: member.name || member.username || "Team Member",
          teamId: createdTeam._id,
          paymentStatus: isWaitlisted ? "waitlisted" : "not_required",
          acceptedCodeOfConduct: true,
        });
      }
    }

    const populatedTeam = createdTeam
      ? await EventTeam.findById(createdTeam._id)
          .populate("leaderUserId", "name username email image")
          .populate("memberUserIds", "name username email image")
          .lean()
      : null;

    return NextResponse.json(
      {
        registration: leaderReg,
        team: populatedTeam || createdTeam,
        requiresPayment: false,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[POST /api/events/[id]/register]", err);

    // Rollback: delete orphaned team and leader registration if created before the failure
    if (leaderRegistrationId) {
      try {
        await EventRegistration.findByIdAndDelete(leaderRegistrationId);
      } catch (rollbackErr) {
        console.error("Failed to rollback leader registration:", rollbackErr);
      }
    }
    if (createdTeamId) {
      try {
        await EventTeam.findByIdAndDelete(createdTeamId);
      } catch (rollbackErr) {
        console.error("Failed to rollback created team:", rollbackErr);
      }
    }

    // Inspect Mongo Duplicate Key (code 11000) for specific feedback
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      const mongoError = err as { errmsg?: string; keyPattern?: Record<string, number> };
      const errString = mongoError.errmsg || JSON.stringify(mongoError.keyPattern || {});

      if (errString.includes("teamName") || mongoError.keyPattern?.teamName) {
        return NextResponse.json(
          { error: "This team name is already taken in this event. Please choose another team name." },
          { status: 409 }
        );
      }
      if (errString.includes("codename") || mongoError.keyPattern?.codename) {
        return NextResponse.json(
          { error: "This codename is already taken. Please choose another codename." },
          { status: 409 }
        );
      }
      if (errString.includes("userId") || mongoError.keyPattern?.userId) {
        return NextResponse.json(
          { error: "You or a member of your team is already registered for this event." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Registration conflict. Please try again with a different team name or codename." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}

// GET /api/events/[id]/register — check registration status
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const auth_check = requireEventParticipant(session);
    if (!auth_check.ok) {
      return NextResponse.json({ registered: false });
    }

    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const event = isObjectId
      ? await Event.findById(id).select("_id").lean()
      : await Event.findOne({ slug: id }).select("_id").lean();

    if (!event) {
      return NextResponse.json({ registered: false });
    }

    const reg = await EventRegistration.findOne({
      eventId: event._id,
      userId: auth_check.userId,
    })
      .select("paymentStatus codename teamId isDisqualified finalScore finalRank")
      .lean();

    let team = null;
    if (reg?.teamId) {
      team = await EventTeam.findById(reg.teamId)
        .populate("leaderUserId", "name username email image")
        .populate("memberUserIds", "name username email image")
        .lean();
    }

    return NextResponse.json({ registered: !!reg, registration: reg, team });
  } catch (err) {
    console.error("[GET /api/events/[id]/register]", err);
    return NextResponse.json({ error: "Failed to check registration." }, { status: 500 });
  }
}

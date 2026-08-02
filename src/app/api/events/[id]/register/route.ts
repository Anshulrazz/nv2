import { NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { EventRegistration } from "@/models/EventRegistration";
import { User } from "@/models/User";
import { CoinTransaction } from "@/models/CoinTransaction";
import { getOrCreateUserWallet } from "@/lib/wallet";
import { isValidObjectId } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    await connectToDatabase();

    let event = null;
    if (isValidObjectId(eventId)) {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ slug: eventId });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status === "cancelled") {
      return NextResponse.json({ error: "This event has been cancelled." }, { status: 400 });
    }

    const now = new Date();
    if (new Date(event.registrationDeadline) < now) {
      return NextResponse.json({ error: "Registration deadline has passed for this event." }, { status: 400 });
    }

    const currentCount = await EventRegistration.countDocuments({ eventId: event._id });
    if (event.maxParticipants && currentCount >= event.maxParticipants) {
      return NextResponse.json({ error: "Event registration limit has been reached." }, { status: 400 });
    }

    const existingRegistration = await EventRegistration.findOne({
      eventId: event._id,
      userId,
    });

    if (existingRegistration) {
      return NextResponse.json({
        message: "You are already registered for this event.",
        isRegistered: true,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isFree = !event.isPaid || (event.priceINR || 0) === 0;

    if (isFree) {
      const reg = await EventRegistration.create({
        eventId: event._id,
        userId,
        paymentStatus: "free",
        amountPaid: 0,
        paymentMethod: "free",
      });

      return NextResponse.json({
        message: `Successfully joined ${event.title}!`,
        isRegistered: true,
        registration: reg,
      });
    }

    // Paid Event Processing
    const priceINR = event.priceINR;

    const userWallet = await getOrCreateUserWallet(user._id);
    if (userWallet.balance < priceINR || (user.coins || 0) < priceINR) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_BALANCE",
          message: `Insufficient coin balance. Required: ${priceINR} coins (₹${priceINR}).`,
          requiredCoins: priceINR,
          currentBalance: userWallet.balance,
        },
        { status: 400 }
      );
    }

    // 70% Host payout, 30% Platform fee
    const hostEarnings = Math.floor(priceINR * 0.7);
    const adminEarnings = priceINR - hostEarnings;

    const host = await User.findById(event.hostId);
    const hostWallet = host ? await getOrCreateUserWallet(host._id) : null;

    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        user.coins = (user.coins || 0) - priceINR;
        await user.save({ session: dbSession });

        userWallet.balance -= priceINR;
        await userWallet.save({ session: dbSession });

        if (host && hostWallet) {
          host.coins = (host.coins || 0) + hostEarnings;
          host.creatorEarnings = (host.creatorEarnings || 0) + hostEarnings;
          await host.save({ session: dbSession });

          hostWallet.balance += hostEarnings;
          await hostWallet.save({ session: dbSession });
        }

        await EventRegistration.create(
          [
            {
              eventId: event._id,
              userId,
              paymentStatus: "paid",
              amountPaid: priceINR,
              paymentMethod: "coins",
            },
          ],
          { session: dbSession }
        );

        if (priceINR > 0) {
          await CoinTransaction.create(
            [
              {
                fromWalletAddress: userWallet.address,
                toWalletAddress: hostWallet ? hostWallet.address : "CREATOR_VAULT",
                amount: hostEarnings,
                type: "course_creator_payout",
                status: "completed",
                metadata: {
                  eventId: event._id,
                  eventTitle: event.title,
                  participantId: userId,
                  share: "70%",
                },
              },
              {
                fromWalletAddress: userWallet.address,
                toWalletAddress: "SYSTEM_ADMIN_VAULT",
                amount: adminEarnings,
                type: "course_platform_fee",
                status: "completed",
                metadata: {
                  eventId: event._id,
                  eventTitle: event.title,
                  participantId: userId,
                  share: "30%",
                },
              },
            ],
            { session: dbSession }
          );
        }
      });
    } catch (txErr) {
      console.warn("MongoDB transaction fallback for event registration:", txErr);
      // Fallback for non-replica set Mongo
      user.coins = (user.coins || 0) - priceINR;
      await user.save();
      userWallet.balance -= priceINR;
      await userWallet.save();

      if (host && hostWallet) {
        host.coins = (host.coins || 0) + hostEarnings;
        host.creatorEarnings = (host.creatorEarnings || 0) + hostEarnings;
        await host.save();
        hostWallet.balance += hostEarnings;
        await hostWallet.save();
      }

      await EventRegistration.create({
        eventId: event._id,
        userId,
        paymentStatus: "paid",
        amountPaid: priceINR,
        paymentMethod: "coins",
      });

      if (priceINR > 0) {
        await CoinTransaction.create({
          fromWalletAddress: userWallet.address,
          toWalletAddress: hostWallet ? hostWallet.address : "CREATOR_VAULT",
          amount: hostEarnings,
          type: "course_creator_payout",
          status: "completed",
          metadata: {
            eventId: event._id,
            eventTitle: event.title,
            participantId: userId,
            share: "70%",
          },
        });
      }
    } finally {
      await dbSession.endSession();
    }

    return NextResponse.json({
      message: `Successfully joined "${event.title}"!`,
      isRegistered: true,
      amountPaid: priceINR,
      userCoins: user.coins,
    });
  } catch (error) {
    console.error("POST /api/events/[id]/register error:", error);
    return NextResponse.json({ error: "Failed to register for event" }, { status: 500 });
  }
}

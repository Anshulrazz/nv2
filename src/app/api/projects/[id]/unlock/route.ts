import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import { CoinTransaction } from "@/models/CoinTransaction";
import { getOrCreateUserWallet } from "@/lib/wallet";
import { isValidObjectId } from "@/lib/validation";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export const POST = auth(async function POST(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid project ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (!project.isPremium || !project.cost || project.cost <= 0) {
      return NextResponse.json({ error: "This is a free project. No need to unlock." }, { status: 400 });
    }

    const isOwner = project.ownerId.toString() === userId;
    const isAlreadyUnlocked = project.unlockedBy.some((uid: mongoose.Types.ObjectId) => uid.toString() === userId);

    if (isOwner || isAlreadyUnlocked) {
      return NextResponse.json({ error: "Project is already unlocked." }, { status: 400 });
    }

    // Buyer verification
    const buyer = await User.findById(userId);
    if (!buyer) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const buyerWallet = await getOrCreateUserWallet(buyer._id);

    if ((buyer.coins || 0) < project.cost || buyerWallet.balance < project.cost) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_BALANCE",
          message: `Insufficient Coins balance. ${project.cost} coins required to unlock.`,
          requiredCoins: project.cost,
          currentBalance: buyerWallet.balance,
        },
        { status: 400 }
      );
    }

    // Revenue split: 70% to creator (teacher or user), 30% to platform
    const creatorCoins = Math.floor(project.cost * 0.7);
    const platformCoins = project.cost - creatorCoins;

    // Project Creator / Owner verification
    const owner = await User.findById(project.ownerId);
    const ownerWallet = owner ? await getOrCreateUserWallet(owner._id) : null;

    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        // 1. Deduct coins from buyer
        buyer.coins = Math.max(0, (buyer.coins || 0) - project.cost);
        buyerWallet.balance = Math.max(0, buyerWallet.balance - project.cost);
        await buyer.save({ session: dbSession });
        await buyerWallet.save({ session: dbSession });

        // 2. Credit 70% earnings to creator (teacher or regular user)
        if (owner && ownerWallet) {
          owner.coins = (owner.coins || 0) + creatorCoins;
          owner.creatorEarnings = (owner.creatorEarnings || 0) + creatorCoins;
          ownerWallet.balance += creatorCoins;
          await owner.save({ session: dbSession });
          await ownerWallet.save({ session: dbSession });
        }

        // 3. Mark project unlocked for buyer
        project.unlockedBy.push(buyer._id);
        await project.save({ session: dbSession });

        // 4. Record ledger transactions
        await CoinTransaction.create(
          [
            {
              fromWalletAddress: buyerWallet.address,
              toWalletAddress: ownerWallet ? ownerWallet.address : "SYSTEM_CREATOR_ESCROW",
              amount: project.cost,
              type: "project_purchase",
              status: "completed",
              metadata: {
                projectId: project._id.toString(),
                projectTitle: project.title,
                buyerId: buyer._id.toString(),
                creatorId: project.ownerId.toString(),
                totalCost: project.cost,
                creatorEarnings: creatorCoins,
                platformFee: platformCoins,
              },
            },
            {
              fromWalletAddress: buyerWallet.address,
              toWalletAddress: ownerWallet ? ownerWallet.address : "SYSTEM_CREATOR_ESCROW",
              amount: creatorCoins,
              type: "project_creator_payout",
              status: "completed",
              metadata: {
                projectId: project._id.toString(),
                projectTitle: project.title,
                creatorId: project.ownerId.toString(),
                buyerId: buyer._id.toString(),
                creatorRole: owner?.role || "user",
                note: `Earned 70% creator revenue (${creatorCoins} coins) from project: ${project.title}`,
              },
            },
            {
              fromWalletAddress: buyerWallet.address,
              toWalletAddress: "PLATFORM_RESERVE",
              amount: platformCoins,
              type: "project_platform_fee",
              status: "completed",
              metadata: {
                projectId: project._id.toString(),
                projectTitle: project.title,
                feePercentage: 30,
              },
            },
          ],
          { session: dbSession }
        );
      });
    } catch (txError) {
      console.warn("Transaction fallback for project unlock:", txError);

      // Fallback without MongoDB replica session
      buyer.coins = Math.max(0, (buyer.coins || 0) - project.cost);
      buyerWallet.balance = Math.max(0, buyerWallet.balance - project.cost);
      await buyer.save();
      await buyerWallet.save();

      if (owner && ownerWallet) {
        owner.coins = (owner.coins || 0) + creatorCoins;
        owner.creatorEarnings = (owner.creatorEarnings || 0) + creatorCoins;
        ownerWallet.balance += creatorCoins;
        await owner.save();
        await ownerWallet.save();
      }

      project.unlockedBy.push(buyer._id);
      await project.save();

      await CoinTransaction.create({
        fromWalletAddress: buyerWallet.address,
        toWalletAddress: ownerWallet ? ownerWallet.address : "SYSTEM_CREATOR_ESCROW",
        amount: project.cost,
        type: "project_purchase",
        status: "completed",
        metadata: {
          projectId: project._id.toString(),
          projectTitle: project.title,
          totalCost: project.cost,
          creatorEarnings: creatorCoins,
          platformFee: platformCoins,
        },
      });
    } finally {
      await dbSession.endSession();
    }

    return NextResponse.json({
      message: "Project unlocked successfully! Creator received 70% earnings.",
      project: {
        id: project._id.toString(),
        title: project.title,
        content: project.content,
        files: project.files,
        productionImages: project.productionImages || [],
      },
      remainingCoins: buyer.coins,
    });
  } catch (error) {
    console.error("Unlock project error:", error);
    return NextResponse.json({ error: "Failed to unlock project." }, { status: 500 });
  }
});


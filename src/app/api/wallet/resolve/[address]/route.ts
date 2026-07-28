import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Wallet } from "@/models/Wallet";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { address } = await params;
    if (!address || typeof address !== "string" || !address.trim()) {
      return NextResponse.json(
        { error: "Wallet address is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const targetAddress = address.trim().toUpperCase();
    const recipientWallet = await Wallet.findOne({ address: targetAddress });

    if (!recipientWallet) {
      return NextResponse.json(
        { error: "Wallet address not found." },
        { status: 404 }
      );
    }

    const recipientUser = await User.findById(recipientWallet.userId).select(
      "name image email"
    );

    if (!recipientUser) {
      return NextResponse.json(
        { error: "Recipient user not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      address: recipientWallet.address,
      name: recipientUser.name || "Notexia Member",
      image: recipientUser.image || null,
    });
  } catch (error) {
    console.error("Resolve wallet address error:", error);
    return NextResponse.json(
      { error: "Failed to resolve wallet address." },
      { status: 500 }
    );
  }
}

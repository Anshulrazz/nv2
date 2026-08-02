import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const adminId = session?.user?.id;
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();

    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const roleFilter = searchParams.get("role");

    const query: Record<string, unknown> = {};
    if (statusFilter && ["pending", "approved", "completed", "rejected"].includes(statusFilter)) {
      query.status = statusFilter;
    }
    if (roleFilter && ["user", "teacher", "admin"].includes(roleFilter)) {
      query.userRole = roleFilter;
    }

    const requests = await WithdrawalRequest.find(query)
      .populate("userId", "name email image role creatorEarnings coins payoutDetails")
      .sort({ createdAt: -1 })
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedRequests = requests.map((item: any) => {
      const userObj = item.userId;
      return {
        id: item._id.toString(),
        userId: userObj?._id ? userObj._id.toString() : "",
        userName: userObj?.name || "Unknown User",
        userEmail: userObj?.email || "",
        userImage: userObj?.image || null,
        userRole: item.userRole || userObj?.role || "user",
        amount: item.amount,
        amountINR: item.amount,
        payoutMethod: item.payoutMethod,
        payoutDetails: item.payoutDetails || {},
        status: item.status,
        adminNote: item.adminNote || "",
        transactionRef: item.transactionRef || "",
        processedAt: item.processedAt ? new Date(item.processedAt).toISOString() : null,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json({
      requests: formattedRequests,
      totalCount: formattedRequests.length,
      pendingCount: formattedRequests.filter((r) => r.status === "pending").length,
    });
  } catch (error: unknown) {
    console.error("Admin GET withdrawals error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch withdrawal requests.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

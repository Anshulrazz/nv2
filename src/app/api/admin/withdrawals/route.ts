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

    const query: Record<string, any> = {};
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

    const formattedRequests = requests.map((item: any) => ({
      id: item._id.toString(),
      userId: item.userId?._id?.toString() || "",
      userName: item.userId?.name || "Unknown User",
      userEmail: item.userId?.email || "",
      userImage: item.userId?.image || null,
      userRole: item.userRole || item.userId?.role || "user",
      amount: item.amount,
      amountINR: item.amount,
      payoutMethod: item.payoutMethod,
      payoutDetails: item.payoutDetails || {},
      status: item.status,
      adminNote: item.adminNote || "",
      transactionRef: item.transactionRef || "",
      processedAt: item.processedAt ? item.processedAt.toISOString() : null,
      createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      requests: formattedRequests,
      totalCount: formattedRequests.length,
      pendingCount: formattedRequests.filter((r) => r.status === "pending").length,
    });
  } catch (error: any) {
    console.error("Admin GET withdrawals error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch withdrawal requests." },
      { status: 500 }
    );
  }
}

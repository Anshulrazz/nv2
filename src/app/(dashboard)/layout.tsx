export const dynamic = "force-dynamic";
import React from "react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import nextDynamic from "next/dynamic";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { SiteSetting } from "@/models/SiteSetting";
import { DirectMessage } from "@/models/DirectMessage";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardShellProvider } from "@/components/layout/DashboardShellContext";

const CustomAlertDialog = nextDynamic(() =>
  import("@/components/ui/CustomAlertDialog").then((mod) => mod.CustomAlertDialog)
);
const PusherListener = nextDynamic(() =>
  import("@/components/PusherListener").then((mod) => mod.PusherListener)
);
const CallWrapper = nextDynamic(() =>
  import("@/components/CallWrapper").then((mod) => mod.CallWrapper)
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  await connectToDatabase();

  // Enforce account suspension gate
  const dbUser = await User.findById(user.id);
  if (dbUser?.isSuspended) {
    redirect("/login?error=suspended");
  }

  // Enforce site maintenance mode gate
  const maintenanceSetting = await SiteSetting.findOne({ key: "maintenanceMode", value: true });
  if (maintenanceSetting && dbUser?.role !== "admin") {
    redirect("/maintenance");
  }

  const unreadCount = await Notification.countDocuments({ recipientId: user.id, isRead: false });
  const unreadMessagesCount = await DirectMessage.countDocuments({ receiverId: user.id, isRead: false });

  // Sign out server action
  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  const serializedUser = {
    id: user.id || "",
    name: user.name || null,
    email: user.email || null,
    image: user.image || null,
    role: dbUser?.role,
  };

  return (
    <DashboardShellProvider>
      <div suppressHydrationWarning className="relative h-[100dvh] w-full bg-bg-base text-foreground flex overflow-hidden">
        <PusherListener />
        <CallWrapper />

        <DashboardShell
          user={serializedUser}
          unreadCount={unreadCount}
          unreadMessagesCount={unreadMessagesCount}
          coins={dbUser?.coins || 0}
          onSignOut={handleSignOut}
        >
          {children}
        </DashboardShell>

        <MobileBottomNav userId={user.id} unreadMessagesCount={unreadMessagesCount} />
        <CustomAlertDialog />
      </div>
    </DashboardShellProvider>
  );
}

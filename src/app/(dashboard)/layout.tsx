

export const dynamic = "force-dynamic";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import nextDynamic from "next/dynamic";
import {
  LogOut,
  User as UserIcon,
  Bell,
  Menu,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CustomAlertDialog = nextDynamic(() => import("@/components/ui/CustomAlertDialog").then((mod) => mod.CustomAlertDialog));
const PusherListener = nextDynamic(() => import("@/components/PusherListener").then((mod) => mod.PusherListener));
const CallWrapper = nextDynamic(() => import("@/components/CallWrapper").then((mod) => mod.CallWrapper));
import { SidebarTree } from "@/components/sidebar/SidebarTree";
import { NavLink } from "@/components/sidebar/NavLink";
import { SidebarNavigation } from "@/components/sidebar/SidebarNavigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { SiteSetting } from "@/models/SiteSetting";
import { DirectMessage } from "@/models/DirectMessage";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";

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

  return (
    <div suppressHydrationWarning className="relative h-[100dvh] bg-transparent text-foreground flex overflow-hidden">
      <PusherListener />
      <CallWrapper />
      {/* ── Glowing ambient background atmosphere ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="ambient-glow-orb-1" />
        <div className="ambient-glow-orb-2" />
        <div className="ambient-glow-orb-3" />
      </div>

      {/* ── Mobile sidebar checkbox (CSS hack) ── */}
      <input type="checkbox" id="sidebar-toggle" className="peer hidden" />

      {/* ── Mobile backdrop – clicking it closes the sidebar ── */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 bg-black/70 z-40 lg:hidden
                   opacity-0 pointer-events-none
                   peer-checked:opacity-100 peer-checked:pointer-events-auto
                   transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <aside
        className="
          fixed inset-y-0 left-0 z-50
          w-72 sm:w-64
          flex flex-col
          border-r border-[#2E2118] bg-[#0D0B08] shadow-[0_20px_60px_rgba(0,0,0,0.5)]
          select-none
          -translate-x-full peer-checked:translate-x-0
          lg:translate-x-0 lg:fixed lg:inset-y-0 lg:left-0 lg:h-full lg:w-64 lg:shrink-0 lg:z-30
          transition-transform duration-300 ease-in-out
        "
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto custom-scroll">
          {/* Brand header */}
          <div className="h-16 px-6 border-b border-[#2E2118] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <img src="/logo.png" className="h-5 w-auto object-contain" alt="Notexia Logo" />
              <span
                className="text-base font-bold tracking-widest text-[#FAFAF8] font-display"
              >
                NOTEXIA
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] bg-[#F5B429]/10 text-[#F5B429] px-2 py-0.5 rounded border border-[#F5B429]/25 font-bold uppercase tracking-wider font-mono"
              >
                MVP
              </span>

              {/* Desktop Notification Bell (Moved to Sidebar to avoid overlay) */}
              <Link href="/notifications" className="hidden lg:flex relative items-center justify-center h-7 w-7 rounded-lg hover:bg-[#150F0B] transition-colors group">
                <Bell className="h-4 w-4 text-[#8A8078] group-hover:text-[#F5B429] transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 min-w-[14px] px-1 bg-[#EF4444] text-[#FAFAF8] text-[8px] font-extrabold flex items-center justify-center rounded-full border border-[#0D0B08] shadow-md">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* Close button – mobile only */}
              <label
                htmlFor="sidebar-toggle"
                className="lg:hidden p-1.5 rounded-md text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#150F0B] cursor-pointer transition-colors"
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </label>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-3">
            <SidebarNavigation
              userId={user.id}
              userRole={dbUser?.role}
              unreadMessagesCount={unreadMessagesCount}
            />
            
            <div className="h-px bg-[#2E2118] w-full my-2" />

            <NavLink href={`/user/${user.id}`} icon={<UserIcon className="h-4 w-4" />} label="My Profile" accent="amber" />
          </nav>

          {/* Divider */}
          <div className="px-4 py-2 shrink-0">
            <div className="h-px bg-[#2E2118] w-full" />
          </div>

          {/* Folders & Notes tree */}
          <div className="px-4 py-2 shrink-0">
            <SidebarTree />
          </div>
        </div>

        {/* User card footer */}
        <div className="p-4 border-t border-[#2E2118] bg-[#0D0B08]/80 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 bg-[#150F0B] rounded-xl border border-[#2E2118] mb-3">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full border border-[#2E2118] object-cover flex-shrink-0"
                unoptimized={user.image.startsWith("http")}
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-[#241811] border border-[#2E2118] flex items-center justify-center text-[#8A8078] flex-shrink-0">
                <UserIcon className="h-4 w-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#FAFAF8] truncate">
                {user.name || "Guest User"}
              </p>
              <p className="text-[10px] text-[#8A8078] truncate">{user.email}</p>
            </div>
          </div>

          <form action={handleSignOut}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#150F0B] h-9 justify-start gap-3 px-3 font-medium text-xs rounded-lg transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </Button>
          </form>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full w-full overflow-hidden relative z-10 lg:pl-64">
        {/* Top bar – mobile only */}
        <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center justify-between px-4 border-b border-[#2E2118] bg-[#0D0B08] shrink-0">
          <div className="flex items-center">
            <label
              htmlFor="sidebar-toggle"
              className="p-2 rounded-md bg-[#150F0B] border border-[#2E2118] hover:bg-[#241811] cursor-pointer transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-[#B8AFA6]" />
            </label>
            <span
              className="ml-3 text-xs sm:text-sm font-bold tracking-widest text-[#FAFAF8] font-display"
            >
              NOTEXIA
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/user/${user.id}`}
              className="flex items-center gap-1.5 bg-[#241811] border border-[#F5B429]/30 rounded-full pl-2.5 pr-1 py-0.5 text-xs font-mono"
            >
              <Coins className="size-3.5 text-[#F5B429]" />
              <span className="text-[#F5B429] font-bold text-[11px]">
                {(dbUser?.coins || 0).toLocaleString()}
              </span>
              <span className="size-5 rounded-full bg-gradient-to-br from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold flex items-center justify-center text-[10px] shrink-0 font-display">
                +
              </span>
            </Link>

            <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-[#150F0B] border border-transparent hover:border-[#2E2118] transition-all group">
              <Bell className="h-4 w-4 text-[#8A8078] group-hover:text-[#F5B429] transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-3.5 min-w-[14px] px-1 bg-[#EF4444] text-[#FAFAF8] text-[8px] font-extrabold flex items-center justify-center rounded-full border border-background">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-transparent pb-16 lg:pb-0 custom-scroll [&:has(.messages-page-root)]:pb-0 [&:has(.messages-page-root)]:overflow-hidden">
          {children}
        </main>
      </div>

      <MobileBottomNav userId={user.id} unreadMessagesCount={unreadMessagesCount} />
      
      <CustomAlertDialog />
    </div>
  );
}



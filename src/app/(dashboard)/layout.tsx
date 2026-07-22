/* eslint-disable @next/next/no-img-element */
export const dynamic = "force-dynamic";
import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import {
  BookOpen,
  
  Settings,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  HelpCircle,
  MessageSquare,
  MessageCircle,
  Rss,
  Bookmark,
  Trophy,
  Bell,
  Newspaper,
  ShieldAlert,
  Users,
  GraduationCap,
  Presentation,
  Menu,
  Briefcase,
  Gift,
} from "lucide-react";
import { CustomAlertDialog } from "@/components/ui/CustomAlertDialog";
import { PusherListener } from "@/components/PusherListener";
import { CallOverlay } from "@/components/CallOverlay";
import { Button } from "@/components/ui/button";
import { SidebarTree } from "@/components/sidebar/SidebarTree";
import { NavLink } from "@/components/sidebar/NavLink";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { SiteSetting } from "@/models/SiteSetting";
import { DirectMessage } from "@/models/DirectMessage";

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
    <div className="relative h-screen bg-background text-foreground flex overflow-hidden cyber-grid">
      <PusherListener />
      <CallOverlay />
      {/* ── Premium Background Glow Shapes ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#8FC3DE]/5 rounded-full filter blur-[120px] pointer-events-none select-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#F28B6E]/4 rounded-full filter blur-[150px] pointer-events-none select-none" />
      <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] bg-[#C9A9E0]/4 rounded-full filter blur-[130px] pointer-events-none select-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[450px] h-[450px] bg-[#F0C93B]/4 rounded-full filter blur-[140px] pointer-events-none select-none" />

      {/* ── Mobile sidebar checkbox (CSS hack) ── */}
      <input type="checkbox" id="sidebar-toggle" className="peer hidden" />

      {/* ── Mobile backdrop – clicking it closes the sidebar ── */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 bg-black/60 z-40 lg:hidden
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
          border-r border-sidebar-border bg-sidebar shadow-[0_20px_60px_rgba(0,0,0,0.35)]
          select-none
          -translate-x-full peer-checked:translate-x-0
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0
          transition-transform duration-300 ease-in-out
        "
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Brand header */}
          <div className="h-16 px-6 border-b border-sidebar-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <img src="/logo.png" className="h-5 w-auto object-contain" alt="Notexia Logo" />
              <span
                className="text-base font-bold tracking-widest text-primary"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                NOTEXIA
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] bg-secondary/15 text-secondary px-2 py-0.5 rounded border border-secondary/20 font-bold uppercase tracking-wider font-mono"
              >
                MVP
              </span>
              {/* Close button – mobile only */}
              <label
                htmlFor="sidebar-toggle"
                className="lg:hidden p-1.5 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850 cursor-pointer transition-colors"
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
          <nav className="p-4 space-y-0.5 overflow-y-auto custom-scroll flex-1">
            <NavLink href="/dashboard"    icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard"   accent="cyan" />
            <NavLink
              href="/messages"
              icon={<MessageCircle className="h-4 w-4" />}
              label="Messages"
              accent="cyan"
              badge={unreadMessagesCount > 0 ? unreadMessagesCount : undefined}
            />
            <NavLink href="/notes"        icon={<BookOpen        className="h-4 w-4" />} label="Notes"        accent="cyan" />
            <NavLink href="/feed"         icon={<Rss             className="h-4 w-4" />} label="Public Feed"  accent="violet" />
            <NavLink href="/community"    icon={<Users           className="h-4 w-4" />} label="Community"    accent="cyan" />
            <NavLink href="/blogs"        icon={<Newspaper       className="h-4 w-4" />} label="Blogs"        accent="violet" />
            <NavLink href="/research"     icon={<GraduationCap   className="h-4 w-4" />} label="Research"     accent="violet" />
            {/* <NavLink href="/chat"         icon={<Sparkles        className="h-4 w-4" />} label="AI Chat"      accent="violet" /> */}
            <NavLink href="/doubts"       icon={<HelpCircle      className="h-4 w-4" />} label="Doubts"       accent="cyan" />
            <NavLink href="/forums"       icon={<MessageSquare   className="h-4 w-4" />} label="Forums"       accent="violet" />
            <NavLink href="/bookmarks"    icon={<Bookmark        className="h-4 w-4" />} label="Bookmarks"    accent="amber" />
            <NavLink href="/leaderboard"  icon={<Trophy          className="h-4 w-4" />} label="Leaderboard"  accent="yellow" />
            <NavLink href="/courses"      icon={<Presentation    className="h-4 w-4" />} label="Courses"      accent="violet" />
            <NavLink href="/projects"     icon={<Briefcase       className="h-4 w-4" />} label="Projects"     accent="cyan" />
            <NavLink href="/referrals"    icon={<Gift            className="h-4 w-4" />} label="Referrals"    accent="yellow" />
            <NavLink href="/settings"     icon={<Settings        className="h-4 w-4" />} label="Settings"     accent="cyan" />

            {(dbUser?.role === "teacher" || dbUser?.role === "admin") && (
              <NavLink href="/teacher/courses" icon={<Presentation className="h-4 w-4" />} label="Teacher Dashboard" accent="yellow" />
            )}
            
            <NavLink href={`/user/${user.id}`} icon={<UserIcon className="h-4 w-4" />} label="My Profile" accent="violet" />

            {dbUser?.role === "admin" && (
              <NavLink href="/admin" icon={<ShieldAlert className="h-4 w-4" />} label="Admin Panel" accent="red" />
            )}
          </nav>

          {/* Divider */}
          <div className="px-4 py-2 shrink-0">
            <div className="h-px bg-sidebar-border w-full" />
          </div>

          {/* Folders & Notes tree */}
          <div className="px-4 py-2 shrink-0">
            <SidebarTree />
          </div>
        </div>

        {/* User card footer */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar/50 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 bg-sidebar-accent rounded-xl border border-sidebar-border mb-3">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-9 w-9 rounded-full border border-border object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground flex-shrink-0">
                <UserIcon className="h-4 w-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-100 truncate" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                {user.name || "Guest User"}
              </p>
              <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
            </div>
          </div>

          <form action={handleSignOut}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full text-neutral-500 hover:text-neutral-100 hover:bg-sidebar-accent h-9 justify-start gap-3 px-3 font-medium text-xs rounded-lg transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </Button>
          </form>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Floating Notification Bell - Desktop Only */}
        <div className="absolute top-3.5 right-6 z-50 pointer-events-auto select-none hidden lg:block">
          <Link href="/notifications" className="flex items-center justify-center h-8.5 w-8.5 rounded-xl bg-sidebar border border-sidebar-border hover:border-primary/40 shadow-lg transition-all group">
            <Bell className="h-4 w-4 text-neutral-450 group-hover:text-primary transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 bg-destructive text-neutral-100 text-[8px] font-extrabold flex items-center justify-center rounded-full border border-background shadow-md">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>

        {/* Top bar – mobile only */}
        <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center justify-between px-4 border-b border-sidebar-border bg-sidebar shrink-0">
          <div className="flex items-center">
            <label
              htmlFor="sidebar-toggle"
              className="p-2 rounded-md bg-sidebar-accent border border-sidebar-border hover:bg-sidebar-accent/80 cursor-pointer transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-neutral-300" />
            </label>
            <span
              className="ml-4 text-sm font-bold tracking-widest text-primary"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              NOTEXIA
            </span>
          </div>

          <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border transition-all group">
            <Bell className="h-4 w-4 text-neutral-450 group-hover:text-primary transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-3.5 min-w-[14px] px-1 bg-destructive text-neutral-100 text-[8px] font-extrabold flex items-center justify-center rounded-full border border-background">
                {unreadCount}
              </span>
            )}
          </Link>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden bg-transparent">
          {children}
        </main>
      </div>

      <CustomAlertDialog />
    </div>
  );
}



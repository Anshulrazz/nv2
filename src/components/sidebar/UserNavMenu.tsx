"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon, Wallet, Settings, LogOut, ChevronUp } from "lucide-react";

interface UserNavMenuProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  coins?: number;
  onSignOut: () => Promise<void>;
}

export function UserNavMenu({ user, coins = 0, onSignOut }: UserNavMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="w-full flex items-center gap-3 p-2 rounded-xl bg-bg-surface hover:bg-bg-elevated border border-border-subtle hover:border-border-default transition-all duration-150 text-left outline-none cursor-pointer group focus-visible:ring-1 focus-visible:ring-accent-primary"
        aria-label="User account menu"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "User avatar"}
            width={36}
            height={36}
            className="size-9 rounded-full border border-border-subtle object-cover shrink-0"
            unoptimized={user.image.startsWith("http")}
          />
        ) : (
          <div className="size-9 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-muted group-hover:text-accent-primary shrink-0 transition-colors">
            <UserIcon className="size-4" />
          </div>
        )}

        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs font-semibold text-text-primary truncate group-hover:text-accent-primary transition-colors">
            {user.name || "Learner"}
          </p>
          <p className="text-[10px] text-text-muted truncate font-mono">
            {user.email || "user@notexia.app"}
          </p>
        </div>

        <ChevronUp className="size-3.5 text-text-muted group-hover:text-text-primary transition-transform duration-150 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-56 bg-bg-surface border-border-subtle shadow-2xl p-1.5 rounded-xl z-50"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-xs text-text-secondary">
            <div className="font-semibold text-text-primary truncate">{user.name || "Learner"}</div>
            <div className="text-[10px] text-text-muted font-mono truncate">{user.email}</div>
            <div className="mt-1 text-[10px] text-accent-primary font-mono font-medium">
              🪙 {coins.toLocaleString()} Coins
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="p-0">
          <Link
            href={`/user/${user.id}`}
            className="flex items-center gap-2.5 w-full px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
          >
            <UserIcon className="size-4 text-accent-primary" />
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="p-0">
          <Link
            href="/wallet"
            className="flex items-center gap-2.5 w-full px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
          >
            <Wallet className="size-4 text-accent-secondary" />
            <span>Wallet & Coins</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="p-0">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 w-full px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
          >
            <Settings className="size-4 text-text-muted" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            onSignOut();
          }}
          className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors"
        >
          <LogOut className="size-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

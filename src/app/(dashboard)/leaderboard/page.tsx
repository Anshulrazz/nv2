"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Medal, Target, Loader2, Sparkles } from "lucide-react";

interface BoardUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  points: number;
}

export default function LeaderboardPage() {
  const [board, setBoard] = useState<BoardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setBoard(data);
        }
      } catch (e) {
        console.error("fetch leaderboard error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="h-7 w-7 rounded-full bg-yellow-500/10 border border-yellow-500/35 flex items-center justify-center text-yellow-500 shadow-md">
            <Trophy className="h-4 w-4" />
          </div>
        );
      case 1:
        return (
          <div className="h-7 w-7 rounded-full bg-neutral-300/10 border border-neutral-350 flex items-center justify-center text-neutral-300">
            <Medal className="h-4 w-4" />
          </div>
        );
      case 2:
        return (
          <div className="h-7 w-7 rounded-full bg-amber-600/10 border border-amber-600/35 flex items-center justify-center text-amber-500">
            <Medal className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div
            className="h-7 w-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 text-xs font-bold"
            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
          >
            {index + 1}
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll relative">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[250px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Banner */}
      <div className="border-b border-neutral-900 bg-neutral-900/10 px-4 sm:px-8 py-4 sm:py-6 shrink-0 select-none relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-cyan-400" />
            <h1
              className="text-xl font-bold text-neutral-100 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Leaderboard
            </h1>
          </div>
          <p className="text-neutral-500 text-xs">Climb ranks by participating in forums, solving doubts, and writing notes.</p>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-3xl w-full mx-auto space-y-8 relative z-10">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 text-xs gap-2 select-none font-semibold">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>CALCULATING POINTS STANDINGS...</span>
          </div>
        ) : board.length === 0 ? (
          <div className="py-20 text-center text-neutral-600 italic select-none">No active users recorded.</div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 podium display */}
            <div className="grid sm:grid-cols-3 gap-4 pt-4 select-none">
              {board.slice(0, 3).map((user, idx) => {
                const borderStyles = [
                  "border-yellow-500/30 bg-yellow-500/5",
                  "border-zinc-300/30 bg-zinc-300/5",
                  "border-amber-600/30 bg-amber-600/5",
                ][idx];
                const textStyles = ["text-yellow-500", "text-zinc-300", "text-amber-500"][idx];

                return (
                  <div
                    key={user._id}
                    className={`border rounded-2xl p-6 text-center space-y-4 relative overflow-hidden transition-all duration-200 hover:scale-[1.01] ${borderStyles}`}
                  >
                    <div className="absolute top-3 right-3">{getRankBadge(idx)}</div>
                    {user.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={user.image} alt={user.name} className="h-16 w-16 rounded-full border border-neutral-800 mx-auto object-cover shadow-sm" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center text-neutral-500 mx-auto text-xl font-bold">
                        {user.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}

                    <div className="space-y-1">
                      <h3
                        className="text-xs font-bold text-neutral-200 truncate"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {user.name || "Guest"}
                      </h3>
                      <p
                        className={`text-[11px] font-extrabold tracking-widest uppercase flex items-center justify-center gap-1 ${textStyles}`}
                        style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                      >
                        <Sparkles className="h-3 w-3" /> {user.points} pts
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* List Table */}
            <div className="bg-neutral-955/30 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-lg">
              <div
                className="px-5 py-3.5 border-b border-white/5 bg-white/[0.02] text-[9px] font-bold text-neutral-500 uppercase tracking-widest grid grid-cols-12 select-none"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-7">User</div>
                <div className="col-span-3 text-right">Activity Points</div>
              </div>

              <div className="divide-y divide-neutral-900/60">
                {board.map((user, idx) => (
                  <div
                    key={user._id}
                    className="px-5 py-4 grid grid-cols-12 items-center hover:bg-neutral-900/10 transition-all text-xs"
                  >
                    <div className="col-span-2 flex justify-center">{getRankBadge(idx)}</div>

                    <div className="col-span-7 flex items-center gap-3">
                      {user.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={user.image} alt={user.name} className="h-7 w-7 rounded-full object-cover shrink-0 border border-neutral-800" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center text-neutral-500 font-bold shrink-0">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p
                          className="font-bold text-neutral-200 truncate"
                          style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                          {user.name || "Anonymous User"}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div
                      className="col-span-3 text-right font-bold text-cyan-400 flex items-center justify-end gap-1 select-none text-xs"
                      style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                    >
                      <Target className="h-3.5 w-3.5 text-neutral-600" />
                      <span>{user.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

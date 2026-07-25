/* eslint-disable @next/next/no-img-element */
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
          <div className="size-8 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
            <Trophy className="size-4" />
          </div>
        );
      case 1:
        return (
          <div className="size-8 rounded-full bg-zinc-300/10 border border-zinc-300/40 flex items-center justify-center text-zinc-300">
            <Medal className="size-4" />
          </div>
        );
      case 2:
        return (
          <div className="size-8 rounded-full bg-amber-700/10 border border-amber-700/40 flex items-center justify-center text-amber-600">
            <Medal className="size-4" />
          </div>
        );
      default:
        return (
          <div className="size-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 text-xs font-mono font-bold">
            {index + 1}
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-amber-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Banner */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-8 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl m-6 sm:m-10 mb-0">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
            <Trophy className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Batch Leaderboard
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest">
                LIVE STANDINGS
              </span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-light mt-1">
              Climb ranks by writing notes, solving peer doubts, and contributing to community forums.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-10 max-w-4xl w-full mx-auto space-y-8 relative z-10">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500 text-xs gap-3 select-none font-semibold">
            <Loader2 className="size-8 animate-spin text-amber-400" />
            <span className="font-mono text-zinc-400 tracking-widest">CALCULATING STANDINGS...</span>
          </div>
        ) : board.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 italic select-none">No active users recorded.</div>
        ) : (
          <div className="space-y-8">
            {/* Top 3 podium display */}
            <div className="grid sm:grid-cols-3 gap-6 select-none">
              {board.slice(0, 3).map((user, idx) => {
                const borderStyles = [
                  "border-amber-500/30 bg-amber-500/5",
                  "border-zinc-300/30 bg-zinc-300/5",
                  "border-amber-700/30 bg-amber-700/5",
                ][idx];
                const textStyles = ["text-amber-400", "text-zinc-300", "text-amber-600"][idx];

                return (
                  <div key={user._id} className="rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl">
                    <div className={`rounded-[calc(2rem-0.5rem)] border ${borderStyles} p-6 text-center space-y-4 relative overflow-hidden h-full flex flex-col justify-between`}>
                      <div className="absolute top-3 right-3">{getRankBadge(idx)}</div>
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="size-16 rounded-full border border-white/10 mx-auto object-cover shadow-sm bg-zinc-900" />
                      ) : (
                        <div className="size-16 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-zinc-400 mx-auto text-xl font-bold">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}

                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white truncate">
                          {user.name || "Guest"}
                        </h3>
                        <p className={`text-xs font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-1 ${textStyles}`}>
                          <Sparkles className="size-3.5" /> {user.points} pts
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* List Table */}
            <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl">
              <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#07070a] border border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 bg-zinc-950/60 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest grid grid-cols-12 select-none">
                  <div className="col-span-2 text-center">Rank</div>
                  <div className="col-span-7">User</div>
                  <div className="col-span-3 text-right">Points</div>
                </div>

                <div className="divide-y divide-white/5">
                  {board.map((user, idx) => (
                    <div key={user._id} className="px-6 py-4 grid grid-cols-12 items-center hover:bg-white/5 transition-colors text-xs">
                      <div className="col-span-2 flex justify-center">{getRankBadge(idx)}</div>

                      <div className="col-span-7 flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt={user.name} className="size-8 rounded-full object-cover shrink-0 border border-white/10 bg-zinc-900" />
                        ) : (
                          <div className="size-8 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-zinc-400 font-bold shrink-0">
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">
                            {user.name || "Anonymous User"}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="col-span-3 text-right font-mono font-bold text-cyan-400 flex items-center justify-end gap-1.5 select-none text-xs">
                        <Target className="size-3.5 text-zinc-500" />
                        <span>{user.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

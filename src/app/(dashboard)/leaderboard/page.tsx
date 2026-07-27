/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Medal, Target, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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
          <div className="size-8 rounded-full bg-[#F0C93B]/20 border border-[#F0C93B]/50 flex items-center justify-center text-[#F0C93B] shadow-[0_0_12px_rgba(240,201,59,0.3)]">
            <Trophy className="size-4" />
          </div>
        );
      case 1:
        return (
          <div className="size-8 rounded-full bg-[#8FC3DE]/20 border border-[#8FC3DE]/40 flex items-center justify-center text-[#8FC3DE]">
            <Medal className="size-4" />
          </div>
        );
      case 2:
        return (
          <div className="size-8 rounded-full bg-[#F28B6E]/20 border border-[#F28B6E]/40 flex items-center justify-center text-[#F28B6E]">
            <Medal className="size-4" />
          </div>
        );
      default:
        return (
          <div className="size-8 rounded-full bg-[#121F18] border border-[#F3F0E4]/15 flex items-center justify-center text-[#9FAEA1] text-xs font-mono font-bold">
            {index + 1}
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#16261D] text-[#F3F0E4] overflow-y-auto custom-scroll relative selection:bg-[#F0C93B]/30 selection:text-[#F0C93B]">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-[#F0C93B]/10 rounded-full blur-[140px] animate-float-glow" />
        <div className="absolute bottom-0 left-1/4 w-[450px] h-[350px] bg-[#8FC3DE]/10 rounded-full blur-[140px] animate-float-glow-reverse" />
      </div>

      {/* Top Banner */}
      <div className="p-4 sm:p-8 lg:p-10 pb-0 relative z-10">
        <div className="border border-[#F3F0E4]/15 bg-[#1A2D23]/80 p-6 sm:p-8 rounded-[2rem] relative z-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-[#F0C93B]/10 flex items-center justify-center border border-[#F0C93B]/30 text-[#F0C93B] shadow-[2px_2px_0_0_#F28B6E] shrink-0">
              <Trophy className="size-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F3F0E4] flex items-center gap-2.5 flex-wrap font-heading">
                Batch Leaderboard
                <span className="text-[10px] font-mono font-bold bg-[#F0C93B]/15 text-[#F0C93B] px-3 py-1 rounded-full border border-[#F0C93B]/30 uppercase tracking-widest">
                  LIVE STANDINGS
                </span>
              </h1>
              <p className="text-[#9FAEA1] text-xs sm:text-sm font-light mt-1">
                Climb ranks by writing notes, solving peer doubts, and contributing to community forums.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 lg:p-10 max-w-4xl w-full mx-auto space-y-8 relative z-10">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#9FAEA1] text-xs gap-3 select-none font-semibold">
            <Loader2 className="size-8 animate-spin text-[#F0C93B]" />
            <span className="font-mono text-[#F0C93B] tracking-widest">CALCULATING STANDINGS...</span>
          </div>
        ) : board.length === 0 ? (
          <div className="py-20 text-center text-[#9FAEA1] italic select-none">No active users recorded.</div>
        ) : (
          <div className="space-y-8">
            {/* Top 3 podium display */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="grid sm:grid-cols-3 gap-6 select-none"
            >
              {board.slice(0, 3).map((user, idx) => {
                const borderStyles = [
                  "border-[#F0C93B]/40 bg-[#F0C93B]/10",
                  "border-[#8FC3DE]/40 bg-[#8FC3DE]/10",
                  "border-[#F28B6E]/40 bg-[#F28B6E]/10",
                ][idx];
                const textStyles = ["text-[#F0C93B]", "text-[#8FC3DE]", "text-[#F28B6E]"][idx];

                return (
                  <motion.div
                    key={user._id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                  >
                    <div className={`rounded-[calc(2rem-0.5rem)] border ${borderStyles} p-6 text-center space-y-4 relative overflow-hidden h-full flex flex-col justify-between`}>
                      <div className="absolute top-3 right-3">{getRankBadge(idx)}</div>
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="size-16 rounded-full border border-[#F3F0E4]/20 mx-auto object-cover shadow-sm bg-[#16261D]" />
                      ) : (
                        <div className="size-16 rounded-full bg-[#121F18] border border-[#F3F0E4]/20 flex items-center justify-center text-[#F0C93B] mx-auto text-xl font-bold font-heading">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}

                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-[#F3F0E4] truncate font-heading">
                          {user.name || "Guest"}
                        </h3>
                        <p className={`text-xs font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-1 ${textStyles}`}>
                          <Sparkles className="size-3.5" /> {user.points} pts
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* List Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", bounce: 0, duration: 0.4 }}
              className="rounded-[2.5rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.3)]"
            >
              <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F3F0E4]/10 bg-[#16261D] text-[10px] font-mono font-bold text-[#9FAEA1] uppercase tracking-widest grid grid-cols-12 select-none">
                  <div className="col-span-2 text-center">Rank</div>
                  <div className="col-span-7">User</div>
                  <div className="col-span-3 text-right">Points</div>
                </div>

                <div className="divide-y divide-[#F3F0E4]/10">
                  {board.map((user, idx) => (
                    <motion.div
                      key={user._id}
                      whileHover={{ backgroundColor: "rgba(240,201,59,0.05)" }}
                      className="px-6 py-4 grid grid-cols-12 items-center transition-colors text-xs"
                    >
                      <div className="col-span-2 flex justify-center">{getRankBadge(idx)}</div>

                      <div className="col-span-7 flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt={user.name} className="size-8 rounded-full object-cover shrink-0 border border-[#F3F0E4]/20 bg-[#16261D]" />
                        ) : (
                          <div className="size-8 rounded-full bg-[#16261D] border border-[#F3F0E4]/20 flex items-center justify-center text-[#F0C93B] font-bold shrink-0">
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-[#F3F0E4] truncate font-heading">
                            {user.name || "Anonymous User"}
                          </p>
                          <p className="text-[10px] text-[#9FAEA1] font-mono truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="col-span-3 text-right font-mono font-bold text-[#F0C93B] flex items-center justify-end gap-1.5 select-none text-xs">
                        <Target className="size-3.5 text-[#9FAEA1]" />
                        <span>{user.points} pts</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

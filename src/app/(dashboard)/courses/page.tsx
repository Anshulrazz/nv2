/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Search,
  BookOpen,
  Coins,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  price?: number;
  isPaid?: boolean;
  isEnrolled?: boolean;
  instructor: {
    _id: string;
    name: string;
    image: string;
  };
  createdAt: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "free" | "paid">("all");

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/courses");
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        setCourses(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching courses";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.instructor?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

      const price = course.price || 0;
      if (filterType === "free") return matchesSearch && price === 0;
      if (filterType === "paid") return matchesSearch && price > 0;
      return matchesSearch;
    });
  }, [courses, searchQuery, filterType]);

  const freeCount = useMemo(() => courses.filter((c) => (c.price || 0) === 0).length, [courses]);
  const paidCount = useMemo(() => courses.filter((c) => (c.price || 0) > 0).length, [courses]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-transparent text-[#FAFAF8] antialiased relative selection:bg-[#F5B429]/30 selection:text-[#FAFAF8]">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#150F0B] border border-[#2E2118] p-6 sm:p-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="size-12 rounded-xl bg-[#F5B429]/10 flex items-center justify-center border border-[#F5B429]/25 text-[#F5B429] shrink-0">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAF8] font-display">
                  Courses & Learning Tracks
                </h1>
                <span className="text-[10px] font-mono font-bold bg-[#F5B429]/10 text-[#F5B429] px-2.5 py-0.5 rounded-full border border-[#F5B429]/25 uppercase tracking-wider">
                  VERIFIED CURRICULA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#8A8078] font-light mt-1 max-w-2xl">
                Explore structured academic curricula, video lectures, and interactive quiz modules curated by verified educators.
              </p>
            </div>
          </div>
        </div>

        {/* Discovery & Search Bar */}
        <div className="mt-6 pt-5 border-t border-[#241811] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8A8078]" />
            <Input
              type="text"
              placeholder="Search tracks, topics, or instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-10 text-xs bg-[#0A0806] border-[#2E2118] text-[#FAFAF8] placeholder:text-[#8A8078] rounded-xl focus:border-[#F5B429]/50 focus:ring-[#F5B429]/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8078] hover:text-[#FAFAF8]"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 ${
                filterType === "all"
                  ? "bg-[#F5B429]/15 text-[#F5B429] border border-[#F5B429]/30"
                  : "bg-[#0A0806] text-[#8A8078] border border-[#2E2118] hover:text-[#FAFAF8]"
              }`}
            >
              All ({courses.length})
            </button>
            <button
              onClick={() => setFilterType("free")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                filterType === "free"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-[#0A0806] text-[#8A8078] border border-[#2E2118] hover:text-[#FAFAF8]"
              }`}
            >
              Free ({freeCount})
            </button>
            <button
              onClick={() => setFilterType("paid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                filterType === "paid"
                  ? "bg-[#F5B429]/15 text-[#F5B429] border border-[#F5B429]/30"
                  : "bg-[#0A0806] text-[#8A8078] border border-[#2E2118] hover:text-[#FAFAF8]"
              }`}
            >
              <Coins className="size-3 text-[#F5B429]" />
              Coins ({paidCount})
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-[#150F0B] border border-[#2E2118] p-4 space-y-4 overflow-hidden"
            >
              <Skeleton className="h-44 w-full rounded-xl bg-[#241811]" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-7 rounded-full bg-[#241811]" />
                  <Skeleton className="h-3 w-28 bg-[#241811]" />
                </div>
                <Skeleton className="h-5 w-3/4 bg-[#241811]" />
                <Skeleton className="h-3 w-full bg-[#241811]" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl bg-[#241811]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-[#150F0B] border border-[#EF4444]/30 p-8 text-center max-w-md mx-auto space-y-3">
          <AlertCircle className="size-8 text-[#EF4444] mx-auto" />
          <h3 className="text-base font-bold text-[#FAFAF8]">Unable to load courses</h3>
          <p className="text-xs text-[#8A8078]">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="btn-premium-primary text-xs h-9 px-4 rounded-xl"
          >
            Try Again
          </Button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-2xl bg-[#150F0B] border border-[#2E2118] p-10 max-w-md mx-auto text-center space-y-4 my-8">
          <div className="size-12 rounded-xl bg-[#241811] flex items-center justify-center text-[#8A8078] mx-auto">
            <BookOpen className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#FAFAF8]">No courses found</h3>
            <p className="text-xs text-[#8A8078] mt-1 max-w-xs mx-auto">
              {searchQuery
                ? `No courses matched "${searchQuery}". Try adjusting your query or filter.`
                : "There are no published courses right now. Check back soon!"}
            </p>
          </div>
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery("")}
              variant="outline"
              className="text-xs h-9 px-4 rounded-xl border-[#2E2118] text-[#FAFAF8] hover:bg-[#241811]"
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
          {filteredCourses.map((course, idx) => {
            const coursePrice = course.price || 0;
            const isFree = coursePrice === 0;

            return (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                key={course._id}
                className="group rounded-2xl bg-[#150F0B] border border-[#2E2118] hover:border-[#F5B429]/40 transition-all duration-300 flex flex-col h-full overflow-hidden"
              >
                {/* Thumbnail Container */}
                <div className="h-44 w-full relative overflow-hidden bg-[#0A0806] border-b border-[#241811] shrink-0">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#150F0B] to-[#0A0806]">
                      <GraduationCap className="size-14 text-[#2E2118] group-hover:text-[#F5B429]/20 transition-colors" />
                    </div>
                  )}

                  {/* Gradient bottom overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#150F0B] via-transparent to-transparent pointer-events-none" />

                  {/* Price Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    {isFree ? (
                      <span className="bg-emerald-500/20 backdrop-blur-md text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 uppercase">
                        FREE TRACK
                      </span>
                    ) : (
                      <span className="bg-[#150F0B]/90 backdrop-blur-md text-[#F5B429] text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-[#F5B429]/30 uppercase flex items-center gap-1">
                        <Coins className="size-3 text-[#F5B429]" />
                        {coursePrice} Coins
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Instructor Info */}
                    <div className="flex items-center gap-2.5">
                      <img
                        src={course.instructor?.image || "/default-avatar.png"}
                        alt={course.instructor?.name || "Instructor"}
                        className="size-7 rounded-full border border-[#2E2118] object-cover bg-[#0A0806]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#FAFAF8] truncate">
                          {course.instructor?.name || "Verified Instructor"}
                        </p>
                        <p className="text-[10px] font-mono text-[#8A8078] flex items-center gap-1">
                          <Clock className="size-3 text-[#8A8078]" />
                          {new Date(course.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Course Title */}
                    <h3 className="text-base font-bold text-[#FAFAF8] line-clamp-1 group-hover:text-[#F5B429] transition-colors font-display">
                      {course.title}
                    </h3>

                    {/* Course Description */}
                    <p className="text-xs text-[#8A8078] font-light line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Card Action */}
                  <div className="pt-2 border-t border-[#241811]/60">
                    <Link href={`/courses/${course._id}`} className="block w-full">
                      <Button className="w-full rounded-xl bg-[#241811] hover:bg-[#F5B429] text-[#FAFAF8] hover:text-[#0A0806] border border-[#2E2118] hover:border-[#F5B429] font-semibold text-xs h-10 flex items-center justify-center gap-1.5 transition-all duration-200">
                        <span>
                          {isFree
                            ? "Start Free Track"
                            : `View & Unlock (${coursePrice} Coins)`}
                        </span>
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

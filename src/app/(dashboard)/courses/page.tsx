/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Presentation, Loader2, BookOpen, Clock, AlertCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string | null;
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

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 bg-[#030305] text-zinc-100 antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-violet-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Banner */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-8 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
            <Presentation className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Interactive Courses
              <span className="text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full border border-violet-500/30 uppercase tracking-widest">
                VERIFIED TRACKS
              </span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-light mt-1">
              Explore premium educational content curated by top instructors and earn completion certificates.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
          <Loader2 className="size-8 animate-spin text-violet-400" />
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">Loading courses...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-rose-500/10 border border-rose-500/20 rounded-[2rem]">
          <AlertCircle className="size-8 text-rose-400" />
          <p className="text-xs font-mono text-rose-300 font-medium">{error}</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl max-w-md mx-auto text-center my-12">
          <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-8 flex flex-col items-center gap-4">
            <BookOpen className="size-10 text-zinc-600" />
            <h3 className="text-lg font-bold text-white">No courses available</h3>
            <p className="text-xs text-zinc-400 font-light max-w-xs">
              It looks like there are no published courses right now. Check back later!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
          {courses.map((course, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={course._id}
              className="group rounded-[2rem] bg-zinc-900/40 border border-white/10 p-2 backdrop-blur-xl hover:border-violet-500/40 transition-all duration-300 flex flex-col h-full"
            >
              <div className="rounded-[calc(2rem-0.5rem)] bg-[#07070a] border border-white/5 overflow-hidden flex flex-col h-full">
                {course.thumbnail ? (
                  <div className="h-48 w-full relative overflow-hidden bg-zinc-950">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-zinc-950 relative overflow-hidden flex items-center justify-center border-b border-white/5">
                    <Presentation className="size-16 text-violet-500/20 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-transparent to-transparent" />
                  </div>
                )}
                
                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={course.instructor?.image || "/default-avatar.png"}
                        alt={course.instructor?.name || "Instructor"}
                        className="size-9 rounded-full border border-white/10 object-cover bg-zinc-900"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{course.instructor?.name || "Anonymous"}</p>
                        <p className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                          <Clock className="size-3 text-violet-400" />
                          {new Date(course.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-violet-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-light line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <Link href={`/courses/${course._id}`} className="block w-full">
                    <Button className="group/btn w-full rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                      <span>Start Course</span>
                      <ArrowUpRight className="size-4 text-zinc-950 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

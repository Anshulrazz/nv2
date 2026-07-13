"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Presentation, Loader2, BookOpen, Clock, AlertCircle } from "lucide-react";
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
      } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 bg-transparent">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border/40 pb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <Presentation className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Courses
              <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
                New
              </span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Explore premium educational content curated by top instructors.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading courses...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-destructive/5 border border-destructive/20 rounded-2xl">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-sidebar/30 border border-border/40 rounded-3xl">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-foreground">No courses available</h3>
          <p className="text-sm text-muted-foreground max-w-sm text-center">
            It looks like there are no published courses right now. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={course._id}
              className="group flex flex-col bg-sidebar/50 rounded-3xl overflow-hidden border border-border/40 hover:border-violet-500/50 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)] transition-all duration-300"
            >
              {course.thumbnail ? (
                <div className="h-48 w-full relative overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
<img
                    src={course.thumbnail}
                    alt={course.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                </div>
              ) : (
                <div className="h-48 w-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 relative overflow-hidden flex items-center justify-center">
                  <Presentation className="h-16 w-16 text-violet-500/40 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                </div>
              )}
              
              <div className="flex-1 p-6 flex flex-col relative z-10 -mt-8">
                <div className="flex items-center gap-3 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
<img
                    src={course.instructor?.image || "/default-avatar.png"}
                    alt={course.instructor?.name || "Instructor"}
                    className="w-10 h-10 rounded-full border-2 border-background shadow-md bg-muted object-cover"
                  />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{course.instructor?.name || "Anonymous"}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1 group-hover:text-violet-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-6">
                  {course.description}
                </p>

                <Link href={`/courses/${course._id}`} className="block w-full">
                  <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-500/20">
                    Start Course
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

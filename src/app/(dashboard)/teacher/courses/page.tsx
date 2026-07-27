/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { Plus, BookOpen, Loader2, AlertCircle, Edit, Trash2, Eye, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CourseItem {
  _id: string;
  title: string;
  thumbnail?: string;
  isPublished?: boolean;
  modules?: unknown[];
  createdAt: string;
}

export default function TeacherDashboardPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const res = await fetch("/api/courses?instructorOnly=true");
      if (!res.ok) throw new Error("Failed to fetch your courses");
      const data = await res.json();
      setCourses(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error fetching courses";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete course");
      fetchCourses();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error deleting course";
      alert(message);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030305] text-zinc-100 overflow-y-auto antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-amber-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Banner */}
      <div className="border-b border-white/5 bg-zinc-950/40 p-8 rounded-[2rem] border border-white/10 relative z-10 backdrop-blur-2xl m-6 sm:m-10 mb-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
              <BookOpen className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                Teacher Dashboard
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest">
                  INSTRUCTOR STUDIO
                </span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light mt-1">
                Manage, edit, and publish your educational courses and module content.
              </p>
            </div>
          </div>

          <Link href="/teacher/courses/new">
            <Button className="group rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <Plus className="size-4 text-zinc-950" />
              <span>Create Course</span>
              <ArrowUpRight className="size-4 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-10 max-w-6xl w-full mx-auto space-y-8 relative z-10">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500 text-xs gap-3 font-semibold">
            <Loader2 className="size-8 animate-spin text-amber-400" />
            <span className="font-mono text-zinc-400 tracking-widest">LOADING INSTRUCTOR COURSES...</span>
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
              <h3 className="text-lg font-bold text-white">No courses created yet</h3>
              <p className="text-xs text-zinc-400 font-light max-w-xs leading-relaxed">
                You haven&apos;t created any courses. Get started by clicking the &quot;Create Course&quot; button above!
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl">
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[10px] uppercase tracking-widest border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 font-bold">Course Title</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold">Modules</th>
                      <th className="px-6 py-4 font-bold">Created</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {courses.map((course) => (
                      <tr key={course._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">
                          <div className="flex items-center gap-3">
                            {course.thumbnail ? (
                              <img src={course.thumbnail} alt="" className="size-10 rounded-xl bg-zinc-950 object-cover border border-white/10" />
                            ) : (
                              <div className="size-10 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-center">
                                <BookOpen className="size-4 text-zinc-500" />
                              </div>
                            )}
                            <span className="truncate max-w-[240px]">{course.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {course.isPublished ? (
                            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                              Published
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-400">
                          {course.modules?.length || 0}
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-500">
                          {new Date(course.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Link href={`/courses/${course._id}`}>
                            <Button variant="outline" size="sm" className="size-8 p-0 bg-zinc-900 border-white/10 hover:bg-zinc-800 text-white">
                              <Eye className="size-4 text-zinc-400" />
                            </Button>
                          </Link>
                          <Link href={`/teacher/courses/${course._id}/edit`}>
                            <Button variant="outline" size="sm" className="size-8 p-0 bg-zinc-900 border-white/10 hover:bg-zinc-800 text-white">
                              <Edit className="size-4 text-zinc-400" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="size-8 p-0 bg-zinc-900 border-white/10 hover:bg-zinc-800 text-rose-400 hover:text-rose-300" onClick={() => handleDelete(course._id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import {
  Plus,
  BookOpen,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  ArrowUpRight,
  Sparkles,
  Layers,
  Coins,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CourseItem {
  _id: string;
  title: string;
  thumbnail?: string;
  price?: number;
  isPublished?: boolean;
  modules?: unknown[];
  createdAt: string;
}

export default function TeacherDashboardPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      setLoading(true);
      setError("");
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

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete course");
      toast.success("Course deleted successfully");
      setCourses((prev) => prev.filter((c) => c._id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error deleting course";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  // Derived Performance Metrics
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.isPublished).length;
  const draftCourses = totalCourses - publishedCourses;
  const totalModules = courses.reduce((acc, c) => acc + (c.modules?.length || 0), 0);
  const totalPotentialCoins = courses
    .filter((c) => c.isPublished)
    .reduce((acc, c) => acc + (c.price || 0), 0);
  const creatorPotentialShare = Math.floor(totalPotentialCoins * 0.7);

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-base text-text-primary overflow-y-auto antialiased relative selection:bg-accent-primary/25 selection:text-text-primary custom-scroll">
      {/* Studio Header */}
      <div className="p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8 relative z-10">
        <div className="rounded-2xl bg-bg-surface border border-border-subtle p-6 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="size-12 sm:size-14 rounded-xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20 text-accent-primary shrink-0">
                <BookOpen className="size-6 sm:size-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-accent-primary/15 text-accent-primary px-2.5 py-0.5 rounded-full border border-accent-primary/25 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="size-3" /> Instructor Studio
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-success/15 text-success px-2.5 py-0.5 rounded-full border border-success/25 uppercase tracking-widest">
                    70% Revenue Share
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-display">
                  Teacher Dashboard
                </h1>
                <p className="text-text-muted text-xs sm:text-sm font-light max-w-2xl leading-relaxed">
                  Design, manage, and publish your course curricula. You receive 70% of every coin payment directly to your creator balance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link href="/courses">
                <Button
                  variant="outline"
                  className="rounded-xl border-border-subtle hover:bg-bg-elevated text-text-secondary hover:text-text-primary text-xs font-semibold h-10 px-4 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Public Catalog</span>
                </Button>
              </Link>
              <Link href="/teacher/courses/new">
                <Button className="btn-premium-primary text-xs h-10 px-5 flex items-center gap-2 font-bold cursor-pointer">
                  <Plus className="size-4" />
                  <span>Create Course</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Performance Overview Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Total Courses */}
          <div className="p-4 sm:p-5 rounded-2xl bg-bg-surface border border-border-subtle hover:border-border-default transition-colors">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Total Courses</span>
              <BookOpen className="size-4 text-accent-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-text-primary">
              {loading ? "..." : totalCourses}
            </div>
            <div className="text-[10px] text-text-muted mt-1 font-mono">
              {draftCourses} draft · {publishedCourses} published
            </div>
          </div>

          {/* Card 2: Published Ratio */}
          <div className="p-4 sm:p-5 rounded-2xl bg-bg-surface border border-border-subtle hover:border-border-default transition-colors">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Live in Catalog</span>
              <CheckCircle2 className="size-4 text-success" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-success">
              {loading ? "..." : publishedCourses}
            </div>
            <div className="text-[10px] text-text-muted mt-1 font-mono">
              Active student enrollments
            </div>
          </div>

          {/* Card 3: Curriculum Modules */}
          <div className="p-4 sm:p-5 rounded-2xl bg-bg-surface border border-border-subtle hover:border-border-default transition-colors">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Total Modules</span>
              <Layers className="size-4 text-accent-secondary" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-text-primary">
              {loading ? "..." : totalModules}
            </div>
            <div className="text-[10px] text-text-muted mt-1 font-mono">
              Structured learning units
            </div>
          </div>

          {/* Card 4: Potential Creator Coins */}
          <div className="p-4 sm:p-5 rounded-2xl bg-bg-surface border border-border-subtle hover:border-border-default transition-colors">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Catalog Value (70%)</span>
              <Coins className="size-4 text-accent-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-accent-primary flex items-center gap-1.5">
              <span>{loading ? "..." : creatorPotentialShare.toLocaleString()}</span>
              <span className="text-xs font-normal text-text-muted">Coins</span>
            </div>
            <div className="text-[10px] text-text-muted mt-1 font-mono">
              Per full catalog enrollment
            </div>
          </div>
        </div>

        {/* Creator Revenue Policy Info Banner */}
        <div className="p-4 rounded-xl bg-bg-elevated/60 border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
              <ShieldCheck className="size-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-semibold text-text-primary block font-display">
                Automated Creator Payouts
              </span>
              <p className="text-text-muted text-[11px]">
                You receive 70% of all coins spent by students on your courses. Coins can be converted to direct UPI / Bank transfer cash in your Wallet.
              </p>
            </div>
          </div>
          <Link href="/wallet" className="shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-accent-primary hover:text-accent-primary-hover font-mono font-medium gap-1 px-2.5 h-8 cursor-pointer"
            >
              <span>View Creator Wallet</span>
              <ArrowUpRight className="size-3" />
            </Button>
          </Link>
        </div>

        {/* Course Management Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-text-primary font-display">
                Created Courses
              </h2>
              <span className="text-xs font-mono font-semibold bg-bg-elevated border border-border-subtle text-text-muted px-2 py-0.5 rounded-full">
                {filteredCourses.length}
              </span>
            </div>

            {courses.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="size-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter courses by title..."
                  className="w-full bg-bg-surface border border-border-subtle rounded-xl pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary transition-colors"
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-text-muted text-xs gap-3 font-semibold bg-bg-surface border border-border-subtle rounded-2xl">
              <Loader2 className="size-7 animate-spin text-accent-primary" />
              <span className="font-mono text-text-muted tracking-wider">Loading your courses...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center">
              <AlertCircle className="size-7 text-destructive" />
              <p className="text-xs font-mono text-destructive font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCourses}
                className="mt-2 text-xs rounded-xl cursor-pointer"
              >
                Try Again
              </Button>
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl bg-bg-surface border border-border-subtle p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 my-6">
              <div className="size-12 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary mx-auto">
                <BookOpen className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-text-primary font-display">No courses created yet</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Start building your first curriculum manually or use our AI Generator to draft 5,000+ words across lectures and quizzes.
                </p>
              </div>
              <Link href="/teacher/courses/new" className="inline-block pt-2">
                <Button className="btn-premium-primary text-xs h-10 px-5 flex items-center gap-2 cursor-pointer font-bold">
                  <Plus className="size-4" />
                  <span>Create Your First Course</span>
                </Button>
              </Link>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-8 text-center bg-bg-surface border border-border-subtle rounded-2xl text-xs text-text-muted font-mono">
              No courses match your filter &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block rounded-2xl bg-bg-surface border border-border-subtle overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-bg-elevated text-text-muted font-mono text-[10px] uppercase tracking-wider border-b border-border-subtle">
                      <tr>
                        <th className="px-6 py-3.5 font-bold">Course Title</th>
                        <th className="px-6 py-3.5 font-bold">Status</th>
                        <th className="px-6 py-3.5 font-bold">Price</th>
                        <th className="px-6 py-3.5 font-bold">Your Share (70%)</th>
                        <th className="px-6 py-3.5 font-bold">Modules</th>
                        <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {filteredCourses.map((course) => {
                        const cPrice = course.price || 0;
                        const creatorShare = Math.floor(cPrice * 0.7);

                        return (
                          <tr
                            key={course._id}
                            className="hover:bg-bg-elevated/40 transition-colors group"
                          >
                            <td className="px-6 py-4 font-semibold text-text-primary">
                              <div className="flex items-center gap-3">
                                {course.thumbnail ? (
                                  <img
                                    src={course.thumbnail}
                                    alt=""
                                    className="size-10 rounded-xl bg-bg-base object-cover border border-border-subtle shrink-0"
                                  />
                                ) : (
                                  <div className="size-10 rounded-xl bg-bg-base border border-border-subtle flex items-center justify-center text-text-muted shrink-0">
                                    <BookOpen className="size-4" />
                                  </div>
                                )}
                                <div className="space-y-0.5 min-w-0">
                                  <span className="truncate block max-w-[260px] text-text-primary font-medium">
                                    {course.title}
                                  </span>
                                  <span className="text-[10px] text-text-muted font-mono block">
                                    Created {new Date(course.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {course.isPublished ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-success/10 text-success border border-success/20 uppercase tracking-wider">
                                  <CheckCircle2 className="size-3" />
                                  <span>Published</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-warning/10 text-warning border border-warning/20 uppercase tracking-wider">
                                  <Clock className="size-3" />
                                  <span>Draft</span>
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-text-primary">
                              {cPrice > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Coins className="size-3 text-accent-primary" />
                                  <span>{cPrice} Coins</span>
                                </div>
                              ) : (
                                <span className="text-text-muted">Free</span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-success">
                              {cPrice > 0 ? (
                                <span>+{creatorShare} Coins (₹{creatorShare})</span>
                              ) : (
                                <span className="text-text-muted">Free Course</span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono text-text-secondary">
                              {course.modules?.length || 0} units
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link href={`/courses/${course._id}`} title="View Student View">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="size-8 p-0 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated cursor-pointer"
                                    aria-label="Preview Course"
                                  >
                                    <Eye className="size-4" />
                                  </Button>
                                </Link>
                                <Link
                                  href={`/teacher/courses/${course._id}/edit`}
                                  title="Edit Curriculum"
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="size-8 p-0 rounded-lg text-text-muted hover:text-accent-primary hover:bg-bg-elevated cursor-pointer"
                                    aria-label="Edit Course"
                                  >
                                    <Edit className="size-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deletingId === course._id}
                                  onClick={() => handleDelete(course._id, course.title)}
                                  className="size-8 p-0 rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                  aria-label="Delete Course"
                                  title="Delete Course"
                                >
                                  {deletingId === course._id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="size-4" />
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card-Based List (< md) */}
              <div className="grid grid-cols-1 gap-3.5 md:hidden">
                {filteredCourses.map((course) => {
                  const cPrice = course.price || 0;
                  const creatorShare = Math.floor(cPrice * 0.7);

                  return (
                    <div
                      key={course._id}
                      className="p-4 rounded-2xl bg-bg-surface border border-border-subtle space-y-3.5 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt=""
                            className="size-12 rounded-xl bg-bg-base object-cover border border-border-subtle shrink-0"
                          />
                        ) : (
                          <div className="size-12 rounded-xl bg-bg-base border border-border-subtle flex items-center justify-center text-text-muted shrink-0">
                            <BookOpen className="size-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            {course.isPublished ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-success/10 text-success border border-success/20 uppercase tracking-wider">
                                <CheckCircle2 className="size-2.5" />
                                <span>Published</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-warning/10 text-warning border border-warning/20 uppercase tracking-wider">
                                <Clock className="size-2.5" />
                                <span>Draft</span>
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-text-muted">
                              {new Date(course.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-semibold text-text-primary text-xs leading-snug line-clamp-2">
                            {course.title}
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-border-subtle/60 text-center font-mono text-xs">
                        <div>
                          <span className="text-[9px] uppercase text-text-muted block">Price</span>
                          <span className="font-bold text-text-primary">
                            {cPrice > 0 ? `${cPrice} Coins` : "Free"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-text-muted block">Your 70%</span>
                          <span className="font-bold text-success">
                            {cPrice > 0 ? `+${creatorShare}` : "0"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-text-muted block">Modules</span>
                          <span className="font-semibold text-text-secondary">
                            {course.modules?.length || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <Link href={`/courses/${course._id}`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[11px] h-9 rounded-xl border-border-subtle hover:bg-bg-elevated text-text-secondary cursor-pointer"
                          >
                            <Eye className="size-3.5 mr-1" />
                            <span>Preview</span>
                          </Button>
                        </Link>
                        <Link href={`/teacher/courses/${course._id}/edit`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[11px] h-9 rounded-xl border-border-subtle hover:bg-bg-elevated text-accent-primary cursor-pointer"
                          >
                            <Edit className="size-3.5 mr-1" />
                            <span>Edit</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === course._id}
                          onClick={() => handleDelete(course._id, course.title)}
                          className="size-9 p-0 rounded-xl text-text-muted hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                          aria-label="Delete Course"
                        >
                          {deletingId === course._id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


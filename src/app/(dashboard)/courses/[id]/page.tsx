/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  FileText,
  CheckCircle,
  Lock,
  Coins,
  Tag,
  Sparkles,
  Menu,
  X,
  Award,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoinConverterModal } from "@/components/wallet/CoinConverterModal";
import { CourseAICopilot } from "@/components/courses/CourseAICopilot";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { toast } from "sonner";

interface CourseLesson {
  title: string;
  isLocked?: boolean;
  text?: string;
  videoUrl?: string;
  photoUrl?: string;
  quiz?: Array<{
    question: string;
    options: string[];
    correctOptionIndex: number;
  }>;
}

interface CourseModule {
  title: string;
  lessons: CourseLesson[];
}

interface CourseData {
  _id: string;
  title: string;
  description: string;
  price?: number;
  isPaid?: boolean;
  isEnrolled?: boolean;
  instructor?: {
    _id?: string;
    name?: string;
    image?: string;
  };
  modules: CourseModule[];
}

interface ProgressData {
  isCompleted?: boolean;
  certificateId?: string;
  completedLessons?: string[];
  quizScores?: Record<string, { score: number }>;
}

export default function CourseViewerPage() {
  const { id } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);

  const [quizAnswers, setQuizAnswers] = useState<Record<string, Record<number, number>>>({});
  const [quizResults, setQuizResults] = useState<Record<string, Record<number, boolean>>>({});

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [submittingProgress, setSubmittingProgress] = useState(false);

  // Mobile curriculum drawer toggle
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);

  // Unlock Modal & Coupon State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  // Coin Converter State
  const [showCoinConverter, setShowCoinConverter] = useState(false);

  // AI Side-Chat Copilot State
  const [showCopilot, setShowCopilot] = useState(false);

  const fetchCourseData = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error("Failed to fetch course details");
      const data = await res.json();
      setCourse(data);

      // Fetch user coins balance
      const resUser = await fetch("/api/user/profile").catch(() => null);
      if (resUser && resUser.ok) {
        const uData = await resUser.json();
        setUserCoins(uData.coins || 0);
      }

      const resProg = await fetch(`/api/courses/${id}/progress`);
      if (resProg.ok) {
        const dataProg = await resProg.json();
        setProgress(dataProg);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchCourseData();
  }, [id, fetchCourseData]);

  const activeModule = course?.modules?.[activeModuleIdx];
  const activeLesson = activeModule?.lessons?.[activeLessonIdx];

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !course) return;
    setIsValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), amount: course.price || 0 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid coupon code.");
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon({
        code: data.code,
        discountAmount: data.discountAmount,
      });
      toast.success(`Coupon '${data.code}' applied! Saved ${data.discountAmount} coins.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to validate coupon.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleUnlockCourse = async () => {
    if (!course) return;
    setIsEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "INSUFFICIENT_BALANCE") {
          toast.error(data.message);
          setShowUnlockModal(false);
          setShowCoinConverter(true);
          return;
        }
        toast.error(data.error || data.message || "Failed to unlock course.");
        return;
      }

      toast.success(data.message || "Course unlocked successfully! 🎉");
      setShowUnlockModal(false);
      setUserCoins(data.studentCoins ?? userCoins - finalCoursePrice);
      fetchCourseData();
    } catch (err) {
      console.error(err);
      toast.error("Error unlocking course.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleQuizSubmit = async (lessonId: string, questions: CourseLesson["quiz"]) => {
    if (!questions) return;
    const answers = quizAnswers[lessonId] || {};

    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === undefined) {
        toast.error(`Please select an answer for question ${i + 1}`);
        return;
      }
    }

    let correctCount = 0;
    const results: Record<number, boolean> = {};
    questions.forEach((q, idx: number) => {
      const isCorrect = answers[idx] === q.correctOptionIndex;
      results[idx] = isCorrect;
      if (isCorrect) correctCount++;
    });
    setQuizResults((prev) => ({ ...prev, [lessonId]: results }));

    try {
      await fetch(`/api/courses/${id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quiz",
          lessonId,
          score: correctCount,
        }),
      });
      const resProg = await fetch(`/api/courses/${id}/progress`);
      if (resProg.ok) {
        setProgress(await resProg.json());
      }
      toast.success(`Quiz completed! You scored ${correctCount}/${questions.length}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save quiz results.");
    }
  };

  const handleCompleteLesson = async () => {
    if (!course || submittingProgress) return;
    setSubmittingProgress(true);
    try {
      const lessonKey = `${activeModuleIdx}-${activeLessonIdx}`;
      const currentMod = course.modules[activeModuleIdx];
      const isLastLesson =
        activeModuleIdx === course.modules.length - 1 &&
        activeLessonIdx === currentMod.lessons.length - 1;

      const res = await fetch(`/api/courses/${id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "completeLesson",
          lessonId: lessonKey,
          completedLesson: lessonKey,
          completeCourse: isLastLesson,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProgress(data);

        if (data.isCompleted) {
          toast.success("🎉 Course Completed! Certificate generated successfully.");
        } else {
          toast.success("Lesson marked as complete! ✓");
        }

        // Advance to next lesson if available
        if (activeLessonIdx < currentMod.lessons.length - 1) {
          setActiveLessonIdx((prev) => prev + 1);
        } else if (activeModuleIdx < course.modules.length - 1) {
          setActiveModuleIdx((prev) => prev + 1);
          setActiveLessonIdx(0);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save progress.");
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handlePrevLesson = () => {
    if (!course) return;
    if (activeLessonIdx > 0) {
      setActiveLessonIdx((prev) => prev - 1);
    } else if (activeModuleIdx > 0) {
      const prevModIdx = activeModuleIdx - 1;
      setActiveModuleIdx(prevModIdx);
      setActiveLessonIdx(course.modules[prevModIdx].lessons.length - 1);
    }
  };

  const handleNextLesson = () => {
    if (!course) return;
    const currentMod = course.modules[activeModuleIdx];
    if (activeLessonIdx < currentMod.lessons.length - 1) {
      setActiveLessonIdx((prev) => prev + 1);
    } else if (activeModuleIdx < course.modules.length - 1) {
      setActiveModuleIdx((prev) => prev + 1);
      setActiveLessonIdx(0);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 gap-3 bg-transparent text-[#8A8078]">
        <Loader2 className="size-8 animate-spin text-[#F5B429]" />
        <span className="font-mono text-xs text-[#8A8078] tracking-widest uppercase">
          Loading learning workstation...
        </span>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center gap-4 bg-transparent max-w-md mx-auto text-center my-16">
        <AlertCircle className="size-10 text-[#EF4444]" />
        <h2 className="text-xl font-bold text-[#FAFAF8] font-display">Error Loading Course</h2>
        <p className="text-[#8A8078] text-xs font-mono">{error || "Course not found"}</p>
        <Button
          onClick={() => router.push("/courses")}
          className="btn-premium-primary rounded-xl text-xs h-9 px-4"
        >
          Back to Courses
        </Button>
      </div>
    );
  }

  const basePrice = course.price || 0;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalCoursePrice = Math.max(0, basePrice - discount);
  const isLockedCourse = !course.isEnrolled && basePrice > 0;

  const hasPrevLesson = activeLessonIdx > 0 || activeModuleIdx > 0;
  const isLastLesson =
    activeModuleIdx === (course.modules?.length || 1) - 1 &&
    activeLessonIdx === (activeModule?.lessons?.length || 1) - 1;
  const isCurrentLessonCompleted = progress?.completedLessons?.includes(
    `${activeModuleIdx}-${activeLessonIdx}`
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-transparent text-[#FAFAF8] antialiased relative selection:bg-[#F5B429]/30 selection:text-[#FAFAF8]">
      {/* Mobile Top Navigation & Curriculum Bar */}
      <div className="lg:hidden p-3 bg-[#150F0B] border-b border-[#2E2118] flex items-center justify-between z-20 shrink-0">
        <Link
          href="/courses"
          className="text-xs font-mono text-[#8A8078] hover:text-[#FAFAF8] flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="size-4" />
          <span>Courses</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setMobileCurriculumOpen(!mobileCurriculumOpen)}
            className="text-xs font-semibold bg-[#241811] hover:bg-[#2E2118] text-[#FAFAF8] border border-[#2E2118] h-8 px-3 rounded-lg flex items-center gap-1.5"
          >
            <Menu className="size-3.5" />
            <span>Curriculum</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCopilot(true)}
            className="text-xs font-semibold bg-[#F5B429]/15 text-[#F5B429] border border-[#F5B429]/30 h-8 px-2.5 rounded-lg flex items-center gap-1"
          >
            <Sparkles className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Mobile Curriculum Overlay Drawer */}
      <AnimatePresence>
        {mobileCurriculumOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileCurriculumOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-4/5 max-w-xs bg-[#150F0B] border-r border-[#2E2118] h-full flex flex-col z-50 overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-[#241811] flex items-center justify-between bg-[#0A0806]">
                <div className="min-w-0 flex-1 pr-2">
                  <h3 className="text-xs font-bold text-[#FAFAF8] truncate font-display">
                    {course.title}
                  </h3>
                  <span className="text-[10px] font-mono text-[#8A8078]">Course Curriculum</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setMobileCurriculumOpen(false)}
                  className="size-7 rounded-lg text-[#8A8078] hover:text-[#FAFAF8]"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scroll">
                {course.modules?.map((mod, mIdx) => (
                  <div key={mIdx} className="space-y-1.5">
                    <h4 className="text-[11px] font-mono font-bold text-[#F5B429] px-2.5 py-1 bg-[#0A0806] rounded-lg border border-[#241811]">
                      Module {mIdx + 1}: {mod.title}
                    </h4>
                    <div className="flex flex-col gap-1 pl-2 border-l border-[#241811] ml-2">
                      {mod.lessons?.map((lesson, lIdx) => {
                        const isActive = mIdx === activeModuleIdx && lIdx === activeLessonIdx;
                        const isCompleted = progress?.completedLessons?.includes(`${mIdx}-${lIdx}`);
                        const lessonLocked = isLockedCourse || lesson.isLocked;

                        return (
                          <button
                            key={lIdx}
                            onClick={() => {
                              if (lessonLocked) {
                                setShowUnlockModal(true);
                                setMobileCurriculumOpen(false);
                                return;
                              }
                              setActiveModuleIdx(mIdx);
                              setActiveLessonIdx(lIdx);
                              setMobileCurriculumOpen(false);
                            }}
                            className={`text-left px-2.5 py-2 text-xs rounded-lg transition-all ${
                              isActive
                                ? "bg-[#F5B429]/15 text-[#F5B429] font-bold border border-[#F5B429]/30"
                                : "text-[#B8AFA6] hover:bg-[#241811] hover:text-[#FAFAF8] border border-transparent"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {isCompleted ? (
                                  <CheckCircle className="size-3.5 text-emerald-400 shrink-0" />
                                ) : lesson.videoUrl ? (
                                  <PlayCircle className="size-3.5 shrink-0 text-[#8A8078]" />
                                ) : (
                                  <FileText className="size-3.5 shrink-0 text-[#8A8078]" />
                                )}
                                <span className="truncate">{lesson.title}</span>
                              </div>
                              {lessonLocked && <Lock className="size-3 text-[#F5B429] shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar Curriculum Drawer */}
      <div className="hidden lg:flex w-80 border-r border-[#2E2118] bg-[#150F0B] flex-col h-auto overflow-hidden shrink-0">
        <div className="p-5 border-b border-[#241811] shrink-0 space-y-3 bg-[#0A0806]/40">
          <Link
            href="/courses"
            className="text-xs font-mono text-[#8A8078] hover:text-[#FAFAF8] flex items-center gap-1 font-medium transition-colors"
          >
            <ChevronLeft className="size-4" /> Back to courses
          </Link>
          <h2 className="text-sm font-bold text-[#FAFAF8] line-clamp-2 font-display">
            {course.title}
          </h2>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <img
                src={course.instructor?.image || "/default-avatar.png"}
                alt={course.instructor?.name || "Instructor"}
                className="size-6 rounded-full object-cover border border-[#2E2118]"
              />
              <span className="text-xs font-mono text-[#8A8078] truncate max-w-[130px]">
                {course.instructor?.name || "Instructor"}
              </span>
            </div>
            {isLockedCourse ? (
              <span className="text-[10px] font-mono font-bold bg-[#F5B429]/15 text-[#F5B429] px-2 py-0.5 rounded-full border border-[#F5B429]/30 flex items-center gap-1">
                <Lock className="size-2.5" /> {basePrice} Coins
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                ENROLLED
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
          {course.modules?.map((mod, mIdx) => (
            <div key={mIdx} className="space-y-1.5">
              <h3 className="text-xs font-mono font-bold text-[#FAFAF8] px-3 py-1.5 bg-[#0A0806] rounded-xl border border-[#241811]">
                Module {mIdx + 1}: {mod.title}
              </h3>
              <div className="flex flex-col gap-1 pl-3 border-l border-[#241811] ml-3 mt-2">
                {mod.lessons?.map((lesson, lIdx) => {
                  const isActive = mIdx === activeModuleIdx && lIdx === activeLessonIdx;
                  const isCompleted = progress?.completedLessons?.includes(`${mIdx}-${lIdx}`);
                  const lessonLocked = isLockedCourse || lesson.isLocked;

                  return (
                    <button
                      key={lIdx}
                      onClick={() => {
                        if (lessonLocked) {
                          setShowUnlockModal(true);
                          return;
                        }
                        setActiveModuleIdx(mIdx);
                        setActiveLessonIdx(lIdx);
                      }}
                      className={`text-left px-3 py-2 text-xs rounded-xl transition-all ${
                        isActive
                          ? "bg-[#F5B429]/15 text-[#F5B429] font-bold border border-[#F5B429]/30"
                          : "text-[#B8AFA6] hover:bg-[#241811] hover:text-[#FAFAF8] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {isCompleted ? (
                            <CheckCircle className="size-3.5 text-emerald-400 shrink-0" />
                          ) : lesson.videoUrl ? (
                            <PlayCircle className="size-3.5 shrink-0 text-[#8A8078]" />
                          ) : (
                            <FileText className="size-3.5 shrink-0 text-[#8A8078]" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        {lessonLocked && <Lock className="size-3 text-[#F5B429] shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative custom-scroll">
        {/* Course Lock Banner Overlay */}
        {isLockedCourse ? (
          <div className="max-w-xl mx-auto my-8 sm:my-14 p-6 sm:p-8 rounded-2xl bg-[#150F0B] border border-[#2E2118] space-y-6 text-center relative overflow-hidden shadow-2xl">
            <div className="size-14 mx-auto rounded-2xl bg-[#F5B429]/10 border border-[#F5B429]/25 flex items-center justify-center text-[#F5B429]">
              <Lock className="size-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F5B429] bg-[#F5B429]/10 px-3 py-1 rounded-full border border-[#F5B429]/25">
                PREMIUM COURSE TRACK
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAF8] font-display">
                {course.title}
              </h2>
              <p className="text-xs text-[#8A8078] max-w-md mx-auto leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0806] border border-[#241811] max-w-sm mx-auto space-y-2 font-mono text-xs">
              <div className="flex justify-between text-[#8A8078]">
                <span>Course Price:</span>
                <span className="font-bold text-[#F5B429]">{basePrice} Coins <span className="text-[#8A8078] font-normal">(₹{(basePrice / 10).toFixed(2)})</span></span>
              </div>
              <div className="flex justify-between text-[#8A8078]">
                <span>Instructor Revenue Share:</span>
                <span className="text-emerald-400 font-bold">70% ({Math.floor(basePrice * 0.7)} Coins)</span>
              </div>
              <div className="flex justify-between text-[#8A8078]">
                <span>Platform Fee:</span>
                <span className="text-[#8A8078]">30%</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#241811]">
                <span className="text-[#8A8078]">Your Balance:</span>
                <span className={userCoins >= basePrice ? "text-emerald-400 font-bold" : "text-[#EF4444] font-bold"}>
                  {userCoins} Coins <span className="font-normal">(₹{(userCoins / 10).toFixed(2)})</span>
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              {userCoins < basePrice && (
                <p className="text-[10px] font-mono text-[#EF4444] text-center w-full">
                  ⚠ You need {basePrice - userCoins} more coins (₹{((basePrice - userCoins) / 10).toFixed(2)}) to unlock this course.
                </p>
              )}
              <Button
                onClick={() => setShowUnlockModal(true)}
                disabled={userCoins < basePrice}
                className="btn-premium-primary text-xs h-11 px-8 rounded-xl disabled:opacity-50"
              >
                <Lock className="size-3.5 mr-2" /> Unlock Full Track ({basePrice} Coins)
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowCoinConverter(true)}
                className="bg-[#241811] hover:bg-[#2E2118] text-[#FAFAF8] border border-[#2E2118] text-xs h-11 px-6 rounded-xl"
              >
                <Coins className="size-3.5 mr-2 text-[#F5B429]" /> {userCoins < basePrice ? "Buy More Coins" : "Convert / Buy Coins"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Completed Course Banner */}
            {progress?.isCompleted && (
              <div className="mb-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2 font-display">
                    <CheckCircle className="size-5" /> Track Completed!
                  </h3>
                  <p className="text-xs text-emerald-300/80 font-light mt-0.5">
                    Congratulations on completing all modules in {course.title}.
                  </p>
                </div>
                {progress.certificateId && (
                  <Link href={`/certificates/${progress.certificateId}`}>
                    <Button className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs h-9 px-5 flex items-center gap-1.5">
                      <Award className="size-4" /> View Certificate
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {activeLesson ? (
              <motion.div
                key={`${activeModuleIdx}-${activeLessonIdx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-6 pb-20"
              >
                {/* Lesson Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#241811] pb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5B429] bg-[#F5B429]/10 px-2.5 py-0.5 rounded-full border border-[#F5B429]/25">
                        Module {activeModuleIdx + 1}: {activeModule?.title}
                      </span>
                      {isCurrentLessonCompleted && (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle className="size-2.5" /> COMPLETED
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#FAFAF8] tracking-tight font-display">
                      {activeLesson.title}
                    </h1>
                  </div>

                  <Button
                    onClick={() => setShowCopilot(true)}
                    className="bg-[#241811] hover:bg-[#F5B429]/10 text-[#FAFAF8] hover:text-[#F5B429] border border-[#2E2118] hover:border-[#F5B429]/30 text-xs font-semibold h-9 px-4 rounded-xl shrink-0 flex items-center gap-2 transition-all"
                  >
                    <Sparkles className="size-3.5 text-[#F5B429]" />
                    <span>Course Copilot</span>
                  </Button>
                </div>

                {/* Video Player */}
                {activeLesson.videoUrl && (
                  <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-[#2E2118] shadow-2xl">
                    {activeLesson.videoUrl.match(/\.(mp4|webm|ogg)$/i) ||
                    activeLesson.videoUrl.startsWith("/uploads/") ? (
                      <video src={activeLesson.videoUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <iframe
                        src={activeLesson.videoUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    )}
                  </div>
                )}

                {/* Photo Illustration */}
                {activeLesson.photoUrl && (
                  <div className="rounded-2xl overflow-hidden border border-[#2E2118] shadow-lg bg-[#0A0806]">
                    <img
                      src={activeLesson.photoUrl}
                      alt="Lesson illustration"
                      className="w-full h-auto object-cover max-h-[500px]"
                    />
                  </div>
                )}

                {/* Lesson Notes (Markdown) */}
                {activeLesson.text && (
                  <div className="bg-[#150F0B] p-6 sm:p-8 rounded-2xl border border-[#2E2118] shadow-lg leading-relaxed">
                    <MarkdownRenderer content={activeLesson.text} />
                  </div>
                )}

                {/* Quiz Section */}
                {activeLesson.quiz && activeLesson.quiz.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-[#241811]">
                    <h3 className="text-base font-bold text-[#FAFAF8] flex items-center gap-2 font-display">
                      <HelpCircle className="size-4 text-[#F5B429]" /> Lesson Practice Quiz
                    </h3>
                    <div className="space-y-4">
                      {activeLesson.quiz.map((q, qIdx) => {
                        const lessonKey = `${activeModuleIdx}-${activeLessonIdx}`;
                        const selectedAnswer = quizAnswers[lessonKey]?.[qIdx];
                        const result = quizResults[lessonKey]?.[qIdx];

                        return (
                          <div
                            key={qIdx}
                            className="p-5 rounded-xl bg-[#0A0806] border border-[#241811] space-y-3"
                          >
                            <p className="text-xs sm:text-sm font-semibold text-[#FAFAF8]">
                              {qIdx + 1}. {q.question}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {q.options.map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() =>
                                    setQuizAnswers((prev) => ({
                                      ...prev,
                                      [lessonKey]: { ...(prev[lessonKey] || {}), [qIdx]: oIdx },
                                    }))
                                  }
                                  className={`p-3 rounded-lg text-xs text-left border transition-all ${
                                    selectedAnswer === oIdx
                                      ? "bg-[#F5B429]/15 text-[#F5B429] border-[#F5B429]/40 font-semibold"
                                      : "bg-[#150F0B] text-[#B8AFA6] border-[#241811] hover:border-[#2E2118] hover:text-[#FAFAF8]"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                            {result !== undefined && (
                              <p className={`text-xs font-mono ${result ? "text-emerald-400" : "text-[#EF4444]"}`}>
                                {result ? "✓ Correct answer!" : "✗ Incorrect answer"}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      <Button
                        type="button"
                        onClick={() =>
                          handleQuizSubmit(`${activeModuleIdx}-${activeLessonIdx}`, activeLesson.quiz)
                        }
                        className="btn-premium-primary text-xs h-10 px-6 rounded-xl"
                      >
                        Submit Quiz Answers
                      </Button>
                    </div>
                  </div>
                )}

                {/* Lesson Navigation & Completion Action Bar */}
                <div className="pt-6 border-t border-[#241811] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {hasPrevLesson && (
                      <Button
                        variant="outline"
                        onClick={handlePrevLesson}
                        className="w-full sm:w-auto rounded-xl border-[#2E2118] bg-[#150F0B] hover:bg-[#241811] text-[#B8AFA6] hover:text-[#FAFAF8] text-xs h-10 px-4 flex items-center gap-1.5"
                      >
                        <ChevronLeft className="size-4" /> Previous
                      </Button>
                    )}
                    {!isLastLesson && isCurrentLessonCompleted && (
                      <Button
                        variant="outline"
                        onClick={handleNextLesson}
                        className="w-full sm:w-auto rounded-xl border-[#2E2118] bg-[#150F0B] hover:bg-[#241811] text-[#B8AFA6] hover:text-[#FAFAF8] text-xs h-10 px-4 flex items-center gap-1.5"
                      >
                        Next <ChevronRight className="size-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {progress?.isCompleted && (
                      <Link
                        href={`/certificates/${progress.certificateId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/25 hover:bg-emerald-500/20 transition-all"
                      >
                        <Award className="size-3.5" /> Certificate
                      </Link>
                    )}

                    <Button
                      onClick={handleCompleteLesson}
                      disabled={submittingProgress}
                      className="btn-premium-primary w-full sm:w-auto rounded-xl text-xs h-11 px-7 flex items-center justify-center gap-2"
                    >
                      {submittingProgress ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : isLastLesson ? (
                        "Complete & Finish Course 🎓"
                      ) : (
                        "Complete & Next Lesson ➔"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-20 text-[#8A8078] font-mono text-xs">
                Select a lesson from the curriculum to begin studying.
              </div>
            )}
          </>
        )}
      </div>

      {/* Unlock Course Modal with Coupon */}
      {showUnlockModal && course && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#150F0B] border border-[#2E2118] rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#241811] pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-[#F5B429]/10 border border-[#F5B429]/25 flex items-center justify-center text-[#F5B429]">
                  <Lock className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#FAFAF8] font-display">Unlock Course</h3>
                  <p className="text-xs text-[#8A8078] line-clamp-1">{course.title}</p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowUnlockModal(false)}
                className="size-8 text-[#8A8078] hover:text-[#FAFAF8] rounded-lg"
              >
                ✕
              </Button>
            </div>

            {/* Price & Revenue Breakdown */}
            <div className="p-4 rounded-xl bg-[#0A0806] border border-[#241811] space-y-2 font-mono text-xs">
              <div className="flex justify-between text-[#8A8078]">
                <span>Base Price:</span>
                <span className="text-[#FAFAF8] font-bold">{basePrice} Coins <span className="font-normal">(₹{(basePrice / 10).toFixed(2)})</span></span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Coupon Discount ({appliedCoupon.code}):</span>
                  <span>-{appliedCoupon.discountAmount} Coins</span>
                </div>
              )}
              <div className="flex justify-between text-[#F5B429] font-bold pt-1 border-t border-[#241811]">
                <span>Final Price:</span>
                <span>{finalCoursePrice} Coins <span className="text-[#F5B429]/70 font-normal">(₹{(finalCoursePrice / 10).toFixed(2)})</span></span>
              </div>
              <div className="flex justify-between text-[10px] text-[#8A8078] pt-1">
                <span>70% Instructor Payout:</span>
                <span className="text-emerald-400">{Math.floor(finalCoursePrice * 0.7)} Coins</span>
              </div>
              <div className="flex justify-between text-[10px] pt-1 border-t border-[#241811]">
                <span className="text-[#8A8078]">Your Balance:</span>
                <span className={userCoins >= finalCoursePrice ? "text-emerald-400 font-bold" : "text-[#EF4444] font-bold"}>
                  {userCoins} Coins <span className="font-normal">(₹{(userCoins / 10).toFixed(2)})</span>
                </span>
              </div>
              {userCoins < finalCoursePrice && (
                <p className="text-[10px] text-[#EF4444] pt-0.5">
                  ⚠ Need {finalCoursePrice - userCoins} more coins (₹{((finalCoursePrice - userCoins) / 10).toFixed(2)})
                </p>
              )}
            </div>

            {/* Coupon Input */}
            <div className="space-y-2 bg-[#0A0806] border border-[#241811] rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8078] font-mono flex items-center gap-1">
                <Tag className="size-3 text-[#F5B429]" /> Coupon Code
              </span>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. NOTEXIA50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="bg-[#150F0B] border-[#2E2118] text-[#FAFAF8] text-xs h-9 font-mono rounded-lg"
                />
                <Button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon || !couponCode.trim()}
                  className="bg-[#241811] hover:bg-[#F5B429]/20 text-[#F5B429] border border-[#F5B429]/30 text-xs h-9 font-bold px-3 shrink-0 rounded-lg"
                >
                  {isValidatingCoupon ? <Loader2 className="size-3.5 animate-spin" /> : "Apply"}
                </Button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleUnlockCourse}
                disabled={isEnrolling || userCoins < finalCoursePrice}
                className="btn-premium-primary w-full text-xs h-11 rounded-xl disabled:opacity-50"
              >
                {isEnrolling ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : userCoins < finalCoursePrice ? (
                  `Insufficient Coins (Need ${finalCoursePrice - userCoins} more)`
                ) : (
                  `Confirm & Unlock Track (${finalCoursePrice} Coins · ₹${(finalCoursePrice / 10).toFixed(2)})`
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowUnlockModal(false);
                  setShowCoinConverter(true);
                }}
                className="w-full text-xs text-[#8A8078] hover:text-[#FAFAF8]"
              >
                {userCoins < finalCoursePrice ? "⚡ Buy Coins to Unlock" : "Need More Coins? Open Coin Converter"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Coin Converter Modal */}
      <CoinConverterModal
        isOpen={showCoinConverter}
        onClose={() => setShowCoinConverter(false)}
        currentBalance={userCoins}
        onSuccess={() => fetchCourseData()}
      />

      {/* Course AI Copilot Drawer */}
      <CourseAICopilot
        courseTitle={course.title}
        lessonTitle={activeLesson?.title || ""}
        lessonText={activeLesson?.text || ""}
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
      />
    </div>
  );
}

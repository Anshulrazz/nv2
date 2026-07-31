/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  PlayCircle,
  FileText,
  CheckCircle,
  Lock,
  Coins,
  Tag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoinConverterModal } from "@/components/wallet/CoinConverterModal";
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
        alert(`Please select an answer for question ${i + 1}`);
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
    } catch (e) {
      console.error(e);
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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 gap-3 bg-[#030305]">
        <Loader2 className="size-8 animate-spin text-amber-400" />
        <span className="font-mono text-xs text-zinc-400 tracking-widest uppercase">
          Loading course curriculum...
        </span>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex-1 p-10 flex flex-col items-center justify-center gap-4 bg-[#030305]">
        <AlertCircle className="size-10 text-rose-400" />
        <h2 className="text-xl font-bold text-white">Error Loading Course</h2>
        <p className="text-zinc-400 text-xs font-mono">{error || "Course not found"}</p>
        <Button
          onClick={() => router.push("/courses")}
          className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs"
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

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#030305] text-zinc-100 antialiased relative">
      {/* Sidebar Curriculum Drawer */}
      <div className="w-full lg:w-80 border-r border-white/5 bg-zinc-950/60 backdrop-blur-2xl flex flex-col h-[40vh] lg:h-auto overflow-hidden shrink-0">
        <div className="p-6 border-b border-white/5 shrink-0 space-y-3">
          <Link
            href="/courses"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-bold uppercase tracking-widest transition-colors"
          >
            <ChevronLeft className="size-4" /> Back to courses
          </Link>
          <h2 className="text-base font-bold text-white line-clamp-2">{course.title}</h2>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <img
                src={course.instructor?.image || "/default-avatar.png"}
                alt={course.instructor?.name || "Instructor"}
                className="size-6 rounded-full object-cover border border-white/10"
              />
              <span className="text-xs font-mono text-zinc-400">
                {course.instructor?.name || "Instructor"}
              </span>
            </div>
            {isLockedCourse ? (
              <span className="text-[10px] font-mono font-bold bg-[#F0C93B]/20 text-[#F0C93B] px-2 py-0.5 rounded-full border border-[#F0C93B]/40 flex items-center gap-1">
                🔒 {basePrice} Coins
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/40">
                UNLOCKED
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
          {course.modules?.map((mod, mIdx) => (
            <div key={mIdx} className="space-y-1.5">
              <h3 className="text-xs font-mono font-bold text-white px-3 py-1.5 bg-zinc-900 rounded-xl border border-white/5">
                Module {mIdx + 1}: {mod.title}
              </h3>
              <div className="flex flex-col gap-1.5 pl-3 border-l border-white/5 ml-3 mt-2">
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
                          ? "bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle className="size-3.5 text-emerald-400" />
                          ) : lesson.videoUrl ? (
                            <PlayCircle className="size-3.5" />
                          ) : (
                            <FileText className="size-3.5" />
                          )}
                          <span className="line-clamp-1">{lesson.title}</span>
                        </div>
                        {lessonLocked && <Lock className="size-3 text-[#F0C93B]" />}
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
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
        {/* Course Lock Banner Overlay */}
        {isLockedCourse ? (
          <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-[#121F18] border border-[#F0C93B]/30 space-y-6 shadow-[0_0_50px_rgba(240,201,59,0.15)] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F0C93B]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="h-16 w-16 mx-auto rounded-3xl bg-[#F0C93B]/15 border border-[#F0C93B]/40 flex items-center justify-center text-[#F0C93B] shadow-inner">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F0C93B] bg-[#F0C93B]/10 px-3 py-1 rounded-full border border-[#F0C93B]/20">
                LOCKED PREMIUM COURSE
              </span>
              <h2 className="text-2xl font-black text-[#F3F0E4] font-heading">{course.title}</h2>
              <p className="text-xs text-[#9FAEA1] max-w-md mx-auto">{course.description}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#16261D] border border-[#F3F0E4]/10 max-w-sm mx-auto space-y-2 font-mono text-xs">
              <div className="flex justify-between text-[#9FAEA1]">
                <span>Course Price:</span>
                <span className="font-bold text-[#F0C93B]">{basePrice} Coins</span>
              </div>
              <div className="flex justify-between text-[#9FAEA1]">
                <span>Instructor Revenue Share:</span>
                <span className="text-emerald-400 font-bold">70% ({Math.floor(basePrice * 0.7)} Coins)</span>
              </div>
              <div className="flex justify-between text-[#9FAEA1]">
                <span>Platform Fee:</span>
                <span className="text-zinc-400">30%</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => setShowUnlockModal(true)}
                className="bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-12 px-8 rounded-xl shadow-[0_0_20px_rgba(240,201,59,0.3)]"
              >
                <Lock className="h-4 w-4 mr-2" /> Unlock Full Course ({basePrice} Coins)
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowCoinConverter(true)}
                className="bg-[#16261D] hover:bg-[#1F362A] text-[#F3F0E4] border border-[#F3F0E4]/10 text-xs h-12 px-6 rounded-xl"
              >
                <Coins className="h-4 w-4 mr-2 text-[#F0C93B]" /> Buy / Convert Coins
              </Button>
            </div>
          </div>
        ) : (
          <>
            {progress?.isCompleted && (
              <div className="mb-8 p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="size-5" /> Course Completed!
                  </h3>
                  <p className="text-xs text-emerald-300/80 font-light mt-1">
                    Congratulations on finishing {course.title}.
                  </p>
                </div>
                {progress.certificateId && (
                  <Link href={`/certificates/${progress.certificateId}`}>
                    <Button className="rounded-full bg-emerald-500 text-zinc-950 font-bold text-xs h-10 px-6">
                      View Certificate
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
                className="max-w-4xl mx-auto space-y-8 pb-20"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    {activeModule?.title}
                  </span>
                  <h1 className="text-3xl font-black text-white tracking-tight">
                    {activeLesson.title}
                  </h1>
                </div>

                {/* Video Player */}
                {activeLesson.videoUrl && (
                  <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl">
                    <div className="w-full aspect-video bg-black rounded-[calc(2.5rem-0.75rem)] overflow-hidden border border-white/5 shadow-2xl">
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
                  </div>
                )}

                {activeLesson.photoUrl && (
                  <div className="rounded-[2rem] overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src={activeLesson.photoUrl}
                      alt="Lesson illustration"
                      className="w-full h-auto object-cover max-h-[500px]"
                    />
                  </div>
                )}

                {activeLesson.text && (
                  <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap bg-zinc-950/40 p-6 rounded-2xl border border-white/5">
                    {activeLesson.text}
                  </div>
                )}

                {/* Quiz */}
                {activeLesson.quiz && activeLesson.quiz.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-white/10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="size-5 text-amber-400" /> Lesson Quiz
                    </h3>
                    <div className="space-y-6">
                      {activeLesson.quiz.map((q, qIdx) => {
                        const lessonKey = `${activeModuleIdx}-${activeLessonIdx}`;
                        const selectedAnswer = quizAnswers[lessonKey]?.[qIdx];
                        const result = quizResults[lessonKey]?.[qIdx];

                        return (
                          <div
                            key={qIdx}
                            className="p-6 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-4"
                          >
                            <p className="text-sm font-bold text-white">
                              {qIdx + 1}. {q.question}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                  className={`p-3 rounded-xl text-xs text-left border transition-all ${
                                    selectedAnswer === oIdx
                                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold"
                                      : "bg-zinc-900/50 text-zinc-300 border-white/5 hover:border-white/20"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                            {result !== undefined && (
                              <p className={`text-xs font-mono ${result ? "text-emerald-400" : "text-rose-400"}`}>
                                {result ? "✓ Correct!" : "✗ Incorrect answer"}
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
                        className="rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs h-10 px-6"
                      >
                        Submit Quiz Answers
                      </Button>
                    </div>
                  </div>
                )}

                {/* Complete Lesson Action */}
                <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {progress?.isCompleted && (
                    <Link
                      href={`/certificates/${progress.certificateId}`}
                      className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
                    >
                      <Sparkles className="size-3.5" /> View Verified Certificate 🎓
                    </Link>
                  )}

                  <Button
                    onClick={handleCompleteLesson}
                    disabled={submittingProgress}
                    className="w-full sm:w-auto rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-12 sm:h-11 px-8 shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 transition-all font-heading"
                  >
                    {submittingProgress ? (
                      <Loader2 className="size-4 animate-spin text-zinc-950" />
                    ) : activeModuleIdx === (course.modules?.length || 1) - 1 &&
                      activeLessonIdx === (activeModule?.lessons?.length || 1) - 1 ? (
                      "Complete & Finish Course 🎓"
                    ) : (
                      "Complete & Next Lesson ➔"
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-20 text-zinc-500 font-mono text-xs">
                Select a lesson from the curriculum sidebar to begin.
              </div>
            )}
          </>
        )}
      </div>

      {/* Unlock Course Modal with Coupon */}
      {showUnlockModal && course && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#121F18] border border-[#F0C93B]/30 rounded-3xl p-6 space-y-5 shadow-[0_0_50px_rgba(240,201,59,0.15)] relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#F3F0E4]/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#F0C93B]/15 border border-[#F0C93B]/40 flex items-center justify-center text-[#F0C93B]">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F3F0E4]">Unlock Course</h3>
                  <p className="text-xs text-[#9FAEA1] line-clamp-1">{course.title}</p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowUnlockModal(false)}
                className="h-8 w-8 text-[#9FAEA1] hover:text-[#F3F0E4] rounded-xl"
              >
                ✕
              </Button>
            </div>

            {/* Price & Revenue Info */}
            <div className="p-4 rounded-2xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-[#9FAEA1]">
                <span>Base Price:</span>
                <span className="text-[#F3F0E4] font-bold">{basePrice} Coins</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Coupon Discount ({appliedCoupon.code}):</span>
                  <span>-{appliedCoupon.discountAmount} Coins</span>
                </div>
              )}
              <div className="flex justify-between text-[#F0C93B] font-bold pt-1 border-t border-[#F3F0E4]/10">
                <span>Final Price:</span>
                <span>{finalCoursePrice} Coins</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#9FAEA1] pt-1">
                <span>70% Instructor Payout:</span>
                <span className="text-emerald-400">{Math.floor(finalCoursePrice * 0.7)} Coins</span>
              </div>
            </div>

            {/* Coupon Code Input */}
            <div className="space-y-2 bg-[#16261D]/80 border border-[#F3F0E4]/10 rounded-2xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FAEA1] font-mono block flex items-center gap-1">
                <Tag className="h-3 w-3 text-[#F0C93B]" /> Apply Coupon Code
              </span>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Coupon code (e.g. NOTEXIA50)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="bg-[#121F18] border-[#F3F0E4]/15 text-[#F3F0E4] text-xs h-9 font-mono"
                />
                <Button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon || !couponCode.trim()}
                  className="bg-[#F0C93B]/20 hover:bg-[#F0C93B]/30 text-[#F0C93B] border border-[#F0C93B]/40 text-xs h-9 font-bold px-3 shrink-0"
                >
                  {isValidatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleUnlockCourse}
                disabled={isEnrolling}
                className="w-full bg-[#F0C93B] hover:bg-[#F0C93B]/90 text-[#2A2118] font-bold text-xs h-11 rounded-xl shadow-[0_0_20px_rgba(240,201,59,0.3)]"
              >
                {isEnrolling ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#2A2118]" />
                ) : (
                  `Confirm & Unlock Course (${finalCoursePrice} Coins)`
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowUnlockModal(false);
                  setShowCoinConverter(true);
                }}
                className="w-full text-xs text-[#9FAEA1] hover:text-[#F3F0E4]"
              >
                Need Coins? Open Coin Converter
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
    </div>
  );
}
